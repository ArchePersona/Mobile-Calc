import { CalculatorState, CalculatorAction, Operator, CalculationRecord } from './types';

export const INITIAL_STATE: CalculatorState = {
  display: '0',
  previousValue: null,
  currentValue: null,
  operation: null,
  overwrite: false,
  hasDecimal: false,
  error: null,
  memory: 0,
  history: []
};

const MAX_DISPLAY_LENGTH = 14;
const PRECISION = 10;

export function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error';
  }
  const rounded = parseFloat(value.toPrecision(PRECISION));
  const stringValue = rounded.toString();
  if (stringValue.length > MAX_DISPLAY_LENGTH) {
    return rounded.toExponential(6);
  }
  return stringValue;
}

export function executeOperation(prev: number, curr: number, op: Operator): number {
  switch (op) {
    case '+':
      return prev + curr;
    case '-':
      return prev - curr;
    case '*':
      return prev * curr;
    case '/':
      if (curr === 0) {
        throw new Error('Division by zero');
      }
      return prev / curr;
    case '^':
      return Math.pow(prev, curr);
    case '%':
      return (prev * curr) / 100;
    default:
      return curr;
  }
}

export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.error) {
    return {
      ...INITIAL_STATE,
      display: digit,
      overwrite: false,
      memory: state.memory,
      history: state.history
    };
  }

  if (state.overwrite || state.display === '0') {
    return {
      ...state,
      display: digit,
      overwrite: false,
      hasDecimal: false
    };
  }

  if (state.display.replace('-', '').length >= MAX_DISPLAY_LENGTH) {
    return state;
  }

  return {
    ...state,
    display: `${state.display}${digit}`
  };
}

export function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.error) {
    return {
      ...INITIAL_STATE,
      display: '0.',
      hasDecimal: true,
      overwrite: false,
      memory: state.memory,
      history: state.history
    };
  }

  if (state.overwrite) {
    return {
      ...state,
      display: '0.',
      hasDecimal: true,
      overwrite: false
    };
  }

  if (state.display.includes('.')) {
    return state;
  }

  return {
    ...state,
    display: `${state.display}.`,
    hasDecimal: true
  };
}

export function setOperation(state: CalculatorState, operation: Operator): CalculatorState {
  if (state.error) {
    return state;
  }

  const currentValue = parseFloat(state.display);
  if (isNaN(currentValue)) {
    return state;
  }

  if (state.previousValue !== null && state.operation && !state.overwrite) {
    try {
      const computed = executeOperation(state.previousValue, currentValue, state.operation);
      const formatted = formatResult(computed);
      return {
        ...state,
        previousValue: computed,
        currentValue: null,
        operation,
        display: formatted,
        overwrite: true,
        hasDecimal: formatted.includes('.')
      };
    } catch (err) {
      return {
        ...state,
        error: err instanceof Error ? err.message : 'Error',
        display: 'Error',
        previousValue: null,
        operation: null,
        overwrite: true
      };
    }
  }

  return {
    ...state,
    previousValue: currentValue,
    operation,
    overwrite: true
  };
}

export function calculate(state: CalculatorState): CalculatorState {
  if (state.error || state.operation === null || state.previousValue === null) {
    return state;
  }

  const current = parseFloat(state.display);
  if (isNaN(current)) {
    return state;
  }

  try {
    const computed = executeOperation(state.previousValue, current, state.operation);
    const formatted = formatResult(computed);
    const record: CalculationRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      expression: `${state.previousValue} ${state.operation} ${current}`,
      result: formatted,
      timestamp: Date.now()
    };

    return {
      ...state,
      display: formatted,
      previousValue: null,
      currentValue: computed,
      operation: null,
      overwrite: true,
      hasDecimal: formatted.includes('.'),
      history: [record, ...state.history].slice(0, 50)
    };
  } catch (err) {
    return {
      ...state,
      error: err instanceof Error ? err.message : 'Error',
      display: 'Error',
      previousValue: null,
      operation: null,
      overwrite: true
    };
  }
}

export function clear(state: CalculatorState): CalculatorState {
  return {
    ...state,
    display: '0',
    hasDecimal: false,
    overwrite: false,
    error: null
  };
}

export function allClear(state?: CalculatorState): CalculatorState {
  return {
    ...INITIAL_STATE,
    memory: state ? state.memory : 0,
    history: state ? state.history : []
  };
}

export function toggleSign(state: CalculatorState): CalculatorState {
  if (state.error || state.display === '0') {
    return state;
  }

  if (state.display.startsWith('-')) {
    return {
      ...state,
      display: state.display.slice(1)
    };
  }

  return {
    ...state,
    display: `-${state.display}`
  };
}

export function percentage(state: CalculatorState): CalculatorState {
  if (state.error) {
    return state;
  }

  const current = parseFloat(state.display);
  if (isNaN(current)) {
    return state;
  }

  let calculated: number;
  if (state.previousValue !== null && state.operation) {
    calculated = (state.previousValue * current) / 100;
  } else {
    calculated = current / 100;
  }

  const formatted = formatResult(calculated);
  return {
    ...state,
    display: formatted,
    hasDecimal: formatted.includes('.'),
    overwrite: true
  };
}

export function backspace(state: CalculatorState): CalculatorState {
  if (state.error || state.overwrite) {
    return state;
  }

  if (state.display.length <= 1 || (state.display.length === 2 && state.display.startsWith('-'))) {
    return {
      ...state,
      display: '0',
      hasDecimal: false
    };
  }

  const nextDisplay = state.display.slice(0, -1);
  return {
    ...state,
    display: nextDisplay,
    hasDecimal: nextDisplay.includes('.')
  };
}

export function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'INPUT_DIGIT':
      return inputDigit(state, action.payload);
    case 'INPUT_DECIMAL':
      return inputDecimal(state);
    case 'SET_OPERATION':
      return setOperation(state, action.payload);
    case 'CALCULATE':
      return calculate(state);
    case 'CLEAR':
      return clear(state);
    case 'ALL_CLEAR':
      return allClear(state);
    case 'CLEAR_ENTRY':
      return clear(state);
    case 'TOGGLE_SIGN':
      return toggleSign(state);
    case 'PERCENTAGE':
      return percentage(state);
    case 'BACKSPACE':
      return backspace(state);
    case 'MEMORY_ADD': {
      const val = parseFloat(state.display) || 0;
      return { ...state, memory: state.memory + val, overwrite: true };
    }
    case 'MEMORY_SUBTRACT': {
      const val = parseFloat(state.display) || 0;
      return { ...state, memory: state.memory - val, overwrite: true };
    }
    case 'MEMORY_RECALL': {
      const formatted = formatResult(state.memory);
      return {
        ...state,
        display: formatted,
        overwrite: true,
        hasDecimal: formatted.includes('.')
      };
    }
    case 'MEMORY_CLEAR':
      return { ...state, memory: 0 };
    default:
      return state;
  }
}
