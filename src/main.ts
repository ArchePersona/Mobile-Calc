/**
 * Mobile Calculator - application entry point.
 *
 * Wires the pure calculation engine (src/core) to the DOM: keypad input,
 * display rendering, history drawer, theme toggle, haptic feedback and
 * keyboard support.
 */
import {
  INITIAL_STATE,
  inputDigit,
  inputDecimal,
  setOperation,
  calculate,
  toggleSign,
  percentage,
  allClear
} from './core/calculator';
import type { CalculatorState, Operator } from './core/types';
import { triggerHaptic, setHapticsEnabled, isHapticsEnabled } from './ui/haptics';
import { getStoredTheme, setStoredTheme, resolveEffectiveTheme } from './ui/theme';
import './theme.css';

let state: CalculatorState = { ...INITIAL_STATE };
let expression = '';

const OP_GLYPH: Record<Operator, string> = {
  '+': '+',
  '-': '\u2212',
  '*': '\u00d7',
  '/': '\u00f7',
  '^': '^',
  '%': '%'
};

const OP_ACTION_MAP: Record<string, Operator> = {
  add: '+',
  subtract: '-',
  multiply: '*',
  divide: '/'
};

function update(next: CalculatorState): void {
  state = next;
  render();
}

function adjustFontSize(element: HTMLElement, text: string): void {
  if (text.length > 10) {
    element.style.fontSize = '2.2rem';
  } else if (text.length > 7) {
    element.style.fontSize = '3.0rem';
  } else {
    element.style.fontSize = '3.8rem';
  }
}

function highlightActiveOperator(): void {
  document.querySelectorAll('.btn-operator').forEach((btn) => {
    const action = btn.getAttribute('data-action') ?? '';
    const op = OP_ACTION_MAP[action];
    if (state.overwrite && op !== undefined && state.operation === op) {
      btn.classList.add('active-operator');
    } else {
      btn.classList.remove('active-operator');
    }
  });
}

function render(): void {
  const elCurrent = document.getElementById('display-current');
  const elExpression = document.getElementById('display-expression');
  if (elCurrent) {
    elCurrent.textContent = state.display;
    adjustFontSize(elCurrent, state.display);
  }
  if (elExpression) {
    elExpression.textContent = expression || '\u00a0';
  }
  highlightActiveOperator();
}

function renderHistory(): void {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (state.history.length === 0) {
    list.innerHTML = '<li class="history-empty">No calculations yet</li>';
    return;
  }
  list.innerHTML = state.history
    .map(
      (item) => `
    <li class="history-item" data-val="${item.result}">
      <div class="history-item-exp">${item.expression}</div>
      <div class="history-item-res">= ${item.result}</div>
    </li>`
    )
    .join('');

  list.querySelectorAll('.history-item').forEach((item) => {
    item.addEventListener('click', () => {
      const val = item.getAttribute('data-val');
      if (val) {
        state = { ...state, display: val, overwrite: true };
        render();
        closeHistory();
      }
    });
  });
}

function openHistory(): void {
  document.getElementById('history-drawer')?.classList.remove('closed');
  document.getElementById('history-overlay')?.classList.remove('hidden');
}

function closeHistory(): void {
  document.getElementById('history-drawer')?.classList.add('closed');
  document.getElementById('history-overlay')?.classList.add('hidden');
}

function applyContainerTheme(resolved: 'light' | 'dark'): void {
  const container = document.getElementById('app-container');
  if (container) {
    container.classList.toggle('dark-theme', resolved === 'dark');
    container.classList.toggle('light-theme', resolved === 'light');
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#121214' : '#ffffff');
}

function handleDigit(value: string): void {
  triggerHaptic('light');
  if (expression.endsWith('=')) expression = '';
  update(inputDigit(state, value));
}

function handleDecimal(): void {
  triggerHaptic('light');
  if (expression.endsWith('=')) expression = '';
  update(inputDecimal(state));
}

function handleOperation(symbol: Operator): void {
  triggerHaptic('medium');
  const next = setOperation(state, symbol);
  expression = `${next.display} ${OP_GLYPH[symbol]}`;
  update(next);
}

function handleEquals(): void {
  triggerHaptic('success');
  const prev = state.previousValue;
  const op = state.operation;
  const current = parseFloat(state.display);
  const next = calculate(state);
  if (next !== state && prev !== null && op !== null && !Number.isNaN(current)) {
    expression = `${prev} ${OP_GLYPH[op]} ${current} =`;
    renderHistory();
  }
  update(next);
}

function handleClear(): void {
  triggerHaptic('medium');
  expression = '';
  update(allClear(state));
}

function setupEventListeners(): void {
  const grid = document.querySelector('.keypad-grid');
  grid?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.calc-btn');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const value = target.getAttribute('data-value');

    switch (action) {
      case 'digit':
        if (value) handleDigit(value);
        break;
      case 'decimal':
        handleDecimal();
        break;
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide': {
        const op = OP_ACTION_MAP[action];
        if (op) handleOperation(op);
        break;
      }
      case 'equals':
        handleEquals();
        break;
      case 'clear':
        handleClear();
        break;
      case 'sign':
        triggerHaptic('light');
        update(toggleSign(state));
        break;
      case 'percent':
        triggerHaptic('light');
        update(percentage(state));
        break;
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
      handleDigit(e.key);
    } else if (e.key === '.') {
      handleDecimal();
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      handleOperation(e.key as Operator);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleEquals();
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      handleClear();
    } else if (e.key === '%') {
      triggerHaptic('light');
      update(percentage(state));
    }
  });

  document.getElementById('btn-history')?.addEventListener('click', openHistory);
  document.getElementById('btn-close-history')?.addEventListener('click', closeHistory);
  document.getElementById('history-overlay')?.addEventListener('click', closeHistory);
  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    state = { ...state, history: [] };
    renderHistory();
  });

  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    const container = document.getElementById('app-container');
    const isDark = container?.classList.contains('dark-theme') ?? true;
    const next = isDark ? 'light' : 'dark';
    applyContainerTheme(next);
    setStoredTheme(next);
  });

  const btnHaptic = document.getElementById('btn-haptic-toggle');
  btnHaptic?.addEventListener('click', () => {
    setHapticsEnabled(!isHapticsEnabled());
    btnHaptic.classList.toggle('active', isHapticsEnabled());
  });
}

function init(): void {
  // Restore persisted theme (defaults to system).
  const stored = getStoredTheme();
  applyContainerTheme(resolveEffectiveTheme(stored ?? 'system'));

  // Reflect persisted haptics state on the toggle button.
  document
    .getElementById('btn-haptic-toggle')
    ?.classList.toggle('active', isHapticsEnabled());

  setupEventListeners();
  render();

  // Offline PWA support.
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err: unknown) => {
        console.warn('Service Worker registration skipped or failed:', err);
      });
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
