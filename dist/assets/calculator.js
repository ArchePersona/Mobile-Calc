/**
 * Mobile Calculator Application Engine - Production Artifact
 */

const INITIAL_STATE = {
  displayValue: '0',
  expression: '',
  firstOperand: null,
  waitingForSecondOperand: false,
  operator: null,
  history: []
};

let state = { ...INITIAL_STATE };
let hapticsEnabled = true;

// Precision helper for clean floating-point arithmetic
function roundPrecision(val, maxDecimals = 10) {
  const factor = Math.pow(10, maxDecimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function formatResult(num) {
  if (!Number.isFinite(num)) {
    return 'Error';
  }
  const strVal = String(roundPrecision(num));
  if (strVal.length > 12) {
    return num.toExponential(6);
  }
  return strVal;
}

export function executeOperation(first, second, op) {
  switch (op) {
    case '+':
      return first + second;
    case '-':
      return first - second;
    case '*':
      return first * second;
    case '/':
      if (second === 0) return NaN;
      return first / second;
    default:
      return second;
  }
}

export function inputDigit(digit) {
  triggerHaptic('digit');
  if (state.waitingForSecondOperand) {
    state.displayValue = digit;
    state.waitingForSecondOperand = false;
  } else {
    state.displayValue = state.displayValue === '0' ? digit : state.displayValue + digit;
  }
  updateUI();
}

export function inputDecimal() {
  triggerHaptic('digit');
  if (state.waitingForSecondOperand) {
    state.displayValue = '0.';
    state.waitingForSecondOperand = false;
    updateUI();
    return;
  }
  if (!state.displayValue.includes('.')) {
    state.displayValue += '.';
  }
  updateUI();
}

export function setOperation(nextOperator) {
  triggerHaptic('operator');
  const inputValue = parseFloat(state.displayValue);

  if (state.operator && state.waitingForSecondOperand) {
    state.operator = nextOperator;
    state.expression = `${state.firstOperand} ${formatOpSymbol(nextOperator)}`;
    updateUI();
    return;
  }

  if (state.firstOperand === null && !isNaN(inputValue)) {
    state.firstOperand = inputValue;
  } else if (state.operator) {
    const result = executeOperation(state.firstOperand, inputValue, state.operator);
    const formatted = formatResult(result);
    state.displayValue = formatted;
    state.firstOperand = Number.isFinite(result) ? result : null;
  }

  state.waitingForSecondOperand = true;
  state.operator = nextOperator;
  state.expression = `${state.displayValue} ${formatOpSymbol(nextOperator)}`;
  updateUI();
}

export function calculate() {
  triggerHaptic('equals');
  const inputValue = parseFloat(state.displayValue);
  if (state.operator === null || state.waitingForSecondOperand) {
    return;
  }

  const result = executeOperation(state.firstOperand, inputValue, state.operator);
  const formatted = formatResult(result);
  const fullExp = `${state.firstOperand} ${formatOpSymbol(state.operator)} ${inputValue}`;

  state.history.unshift({
    expression: fullExp,
    result: formatted,
    timestamp: Date.now()
  });

  state.displayValue = formatted;
  state.expression = `${fullExp} =`;
  state.firstOperand = null;
  state.operator = null;
  state.waitingForSecondOperand = false;

  updateUI();
  renderHistory();
}

export function toggleSign() {
  triggerHaptic('function');
  const val = parseFloat(state.displayValue);
  if (!isNaN(val) && val !== 0) {
    state.displayValue = String(-val);
    updateUI();
  }
}

export function percent() {
  triggerHaptic('function');
  const val = parseFloat(state.displayValue);
  if (!isNaN(val)) {
    const res = val / 100;
    state.displayValue = formatResult(res);
    updateUI();
  }
}

export function clear() {
  triggerHaptic('clear');
  state.displayValue = '0';
  state.expression = '';
  state.firstOperand = null;
  state.waitingForSecondOperand = false;
  state.operator = null;
  updateUI();
}

function formatOpSymbol(op) {
  switch (op) {
    case '+': return '+';
    case '-': return '−';
    case '*': return '×';
    case '/': return '÷';
    default: return op;
  }
}

export function triggerHaptic(type = 'digit') {
  if (!hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }
  switch (type) {
    case 'digit':
      navigator.vibrate(10);
      break;
    case 'operator':
    case 'function':
      navigator.vibrate(15);
      break;
    case 'equals':
      navigator.vibrate([20, 30, 20]);
      break;
    case 'clear':
      navigator.vibrate(25);
      break;
    default:
      navigator.vibrate(10);
  }
}

function updateUI() {
  const elCurrent = document.getElementById('display-current');
  const elExpression = document.getElementById('display-expression');
  if (elCurrent) {
    elCurrent.textContent = state.displayValue;
    adjustFontSize(elCurrent, state.displayValue);
  }
  if (elExpression) {
    elExpression.textContent = state.expression || ' ';
  }
  highlightActiveOperator();
}

function adjustFontSize(element, text) {
  if (text.length > 10) {
    element.style.fontSize = '2.2rem';
  } else if (text.length > 7) {
    element.style.fontSize = '3.0rem';
  } else {
    element.style.fontSize = '3.8rem';
  }
}

function highlightActiveOperator() {
  const buttons = document.querySelectorAll('.btn-operator');
  buttons.forEach(btn => {
    const opAction = btn.getAttribute('data-action');
    const opMap = { add: '+', subtract: '-', multiply: '*', divide: '/' };
    if (state.waitingForSecondOperand && state.operator === opMap[opAction]) {
      btn.classList.add('active-operator');
    } else {
      btn.classList.remove('active-operator');
    }
  });
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (state.history.length === 0) {
    list.innerHTML = '<li class="history-empty">No calculations yet</li>';
    return;
  }
  list.innerHTML = state.history.map(item => `
    <li class="history-item" data-val="${item.result}">
      <div class="history-item-exp">${item.expression}</div>
      <div class="history-item-res">= ${item.result}</div>
    </li>
  `).join('');

  list.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const val = item.getAttribute('data-val');
      if (val) {
        state.displayValue = val;
        state.waitingForSecondOperand = false;
        updateUI();
        closeHistory();
      }
    });
  });
}

function openHistory() {
  document.getElementById('history-drawer')?.classList.remove('closed');
  document.getElementById('history-overlay')?.classList.remove('hidden');
}

function closeHistory() {
  document.getElementById('history-drawer')?.classList.add('closed');
  document.getElementById('history-overlay')?.classList.add('hidden');
}

function setupEventListeners() {
  const grid = document.querySelector('.keypad-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const target = e.target.closest('.calc-btn');
      if (!target) return;
      const action = target.getAttribute('data-action');
      const value = target.getAttribute('data-value');

      switch (action) {
        case 'digit':
          if (value) inputDigit(value);
          break;
        case 'decimal':
          inputDecimal();
          break;
        case 'add':
          setOperation('+');
          break;
        case 'subtract':
          setOperation('-');
          break;
        case 'multiply':
          setOperation('*');
          break;
        case 'divide':
          setOperation('/');
          break;
        case 'equals':
          calculate();
          break;
        case 'clear':
          clear();
          break;
        case 'sign':
          toggleSign();
          break;
        case 'percent':
          percent();
          break;
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
      inputDigit(e.key);
    } else if (e.key === '.') {
      inputDecimal();
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      setOperation(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calculate();
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      clear();
    } else if (e.key === '%') {
      percent();
    }
  });

  document.getElementById('btn-history')?.addEventListener('click', openHistory);
  document.getElementById('btn-close-history')?.addEventListener('click', closeHistory);
  document.getElementById('history-overlay')?.addEventListener('click', closeHistory);
  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    state.history = [];
    renderHistory();
  });

  const btnTheme = document.getElementById('btn-theme-toggle');
  btnTheme?.addEventListener('click', () => {
    const container = document.getElementById('app-container');
    if (container) {
      const isDark = container.classList.contains('dark-theme');
      container.classList.toggle('dark-theme', !isDark);
      container.classList.toggle('light-theme', isDark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#ffffff' : '#121214');
    }
  });

  const btnHaptic = document.getElementById('btn-haptic-toggle');
  btnHaptic?.addEventListener('click', () => {
    hapticsEnabled = !hapticsEnabled;
    btnHaptic.classList.toggle('active', hapticsEnabled);
  });
}

// Register Service Worker for offline PWA functionality
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service Worker registration skipped or failed:', err);
    });
  });
}

// Initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupEventListeners();
      updateUI();
    });
  } else {
    setupEventListeners();
    updateUI();
  }
}
