import { describe, it, expect } from 'vitest';
import {
  INITIAL_STATE,
  formatResult,
  executeOperation,
  inputDigit,
  inputDecimal,
  setOperation,
  calculate,
  clear
} from '../../src/core/calculator';
import type { CalculatorState, Operator } from '../../src/core/types';

describe('Core Calculator Logic', () => {
  describe('INITIAL_STATE', () => {
    it('should have initial default values', () => {
      expect(INITIAL_STATE.displayValue).toBe('0');
      expect(INITIAL_STATE.previousValue).toBeNull();
      expect(INITIAL_STATE.operator).toBeNull();
      expect(INITIAL_STATE.waitingForOperand).toBe(false);
      expect(INITIAL_STATE.error).toBeNull();
    });
  });

  describe('executeOperation', () => {
    it('should perform addition correctly', () => {
      expect(executeOperation(12, 8, '+')).toBe(20);
      expect(executeOperation(-5, 15, '+')).toBe(10);
    });

    it('should perform subtraction correctly', () => {
      expect(executeOperation(20, 7, '-')).toBe(13);
      expect(executeOperation(5, 10, '-')).toBe(-5);
    });

    it('should perform multiplication correctly', () => {
      expect(executeOperation(6, 7, '*')).toBe(42);
      expect(executeOperation(-3, 4, '*')).toBe(-12);
    });

    it('should perform division correctly', () => {
      expect(executeOperation(20, 4, '/')).toBe(5);
      expect(executeOperation(7, 2, '/')).toBe(3.5);
    });

    it('should handle division by zero appropriately', () => {
      const result = executeOperation(10, 0, '/');
      expect(Number.isFinite(result)).toBe(false);
    });
  });

  describe('formatResult', () => {
    it('should format standard integers and decimals', () => {
      expect(formatResult(42)).toBe('42');
      expect(formatResult(3.14159)).toBe('3.14159');
    });

    it('should handle floating-point precision issues', () => {
      const result = formatResult(0.1 + 0.2);
      expect(result).toBe('0.3');
    });

    it('should handle division by zero values or NaN gracefully', () => {
      expect(formatResult(Infinity)).toMatch(/Error|Infinity/i);
      expect(formatResult(NaN)).toMatch(/Error|NaN/i);
    });
  });

  describe('inputDigit', () => {
    it('should replace initial zero with entered digit', () => {
      const state = inputDigit(INITIAL_STATE, '7');
      expect(state.displayValue).toBe('7');
      expect(state.waitingForOperand).toBe(false);
    });

    it('should append digits to existing number', () => {
      let state = inputDigit(INITIAL_STATE, '1');
      state = inputDigit(state, '2');
      state = inputDigit(state, '3');
      expect(state.displayValue).toBe('123');
    });

    it('should replace display when waitingForOperand is true', () => {
      const waitingState: CalculatorState = {
        ...INITIAL_STATE,
        displayValue: '50',
        previousValue: 50,
        operator: '+',
        waitingForOperand: true
      };

      const state = inputDigit(waitingState, '9');
      expect(state.displayValue).toBe('9');
      expect(state.waitingForOperand).toBe(false);
    });
  });

  describe('inputDecimal', () => {
    it('should append decimal point to integer display', () => {
      const state = inputDigit(INITIAL_STATE, '5');
      const withDecimal = inputDecimal(state);
      expect(withDecimal.displayValue).toBe('5.');
    });

    it('should not allow multiple decimal points in display', () => {
      let state = inputDigit(INITIAL_STATE, '5');
      state = inputDecimal(state);
      state = inputDigit(state, '2');
      state = inputDecimal(state);
      expect(state.displayValue).toBe('5.2');
    });

    it('should start with 0. when decimal is pressed while waiting for operand', () => {
      const waitingState: CalculatorState = {
        ...INITIAL_STATE,
        displayValue: '25',
        previousValue: 25,
        operator: '-',
        waitingForOperand: true
      };
      const state = inputDecimal(waitingState);
      expect(state.displayValue).toBe('0.');
      expect(state.waitingForOperand).toBe(false);
    });
  });

  describe('setOperation and consecutive operations', () => {
    it('should set operator and store previous value', () => {
      let state = inputDigit(INITIAL_STATE, '8');
      state = setOperation(state, '+');
      expect(state.operator).toBe('+');
      expect(state.previousValue).toBe(8);
      expect(state.waitingForOperand).toBe(true);
    });

    it('should allow changing operator if next digit has not been entered', () => {
      let state = inputDigit(INITIAL_STATE, '8');
      state = setOperation(state, '+');
      state = setOperation(state, '*');
      expect(state.operator).toBe('*');
      expect(state.previousValue).toBe(8);
    });

    it('should calculate intermediate result on consecutive operations', () => {
      let state = inputDigit(INITIAL_STATE, '10');
      state = setOperation(state, '+');
      state = inputDigit(state, '5');
      state = setOperation(state, '*');
      expect(state.displayValue).toBe('15');
      expect(state.previousValue).toBe(15);
      expect(state.operator).toBe('*');
      expect(state.waitingForOperand).toBe(true);
    });
  });

  describe('calculate', () => {
    it('should compute final result and reset operator state', () => {
      let state = inputDigit(INITIAL_STATE, '10');
      state = setOperation(state, '-');
      state = inputDigit(state, '4');
      state = calculate(state);
      expect(state.displayValue).toBe('6');
      expect(state.previousValue).toBeNull();
      expect(state.operator).toBeNull();
      expect(state.waitingForOperand).toBe(true);
    });

    it('should not change state if calculate is pressed without operator', () => {
      const state = inputDigit(INITIAL_STATE, '42');
      const result = calculate(state);
      expect(result.displayValue).toBe('42');
      expect(result.operator).toBeNull();
    });
  });

  describe('clear', () => {
    it('should reset state to INITIAL_STATE', () => {
      let state = inputDigit(INITIAL_STATE, '9');
      state = setOperation(state, '+');
      state = inputDigit(state, '3');
      const cleared = clear();
      expect(cleared.displayValue).toBe('0');
      expect(cleared.previousValue).toBeNull();
      expect(cleared.operator).toBeNull();
      expect(cleared.waitingForOperand).toBe(false);
      expect(cleared.error).toBeNull();
    });
  });
});
