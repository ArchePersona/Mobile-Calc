export type Operator = '+' | '-' | '*' | '/' | '^' | '%';

export type ActionType =
  | 'INPUT_DIGIT'
  | 'INPUT_DECIMAL'
  | 'SET_OPERATION'
  | 'CALCULATE'
  | 'CLEAR'
  | 'ALL_CLEAR'
  | 'CLEAR_ENTRY'
  | 'TOGGLE_SIGN'
  | 'PERCENTAGE'
  | 'BACKSPACE'
  | 'MEMORY_ADD'
  | 'MEMORY_SUBTRACT'
  | 'MEMORY_RECALL'
  | 'MEMORY_CLEAR';

export interface CalculationRecord {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface CalculatorState {
  display: string;
  previousValue: number | null;
  currentValue: number | null;
  operation: Operator | null;
  overwrite: boolean;
  hasDecimal: boolean;
  error: string | null;
  memory: number;
  history: CalculationRecord[];
}

export type CalculatorAction =
  | { type: 'INPUT_DIGIT'; payload: string }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'SET_OPERATION'; payload: Operator }
  | { type: 'CALCULATE' }
  | { type: 'CLEAR' }
  | { type: 'ALL_CLEAR' }
  | { type: 'CLEAR_ENTRY' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'PERCENTAGE' }
  | { type: 'BACKSPACE' }
  | { type: 'MEMORY_ADD' }
  | { type: 'MEMORY_SUBTRACT' }
  | { type: 'MEMORY_RECALL' }
  | { type: 'MEMORY_CLEAR' };
