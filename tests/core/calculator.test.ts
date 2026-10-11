import { describe, it, expect } from 'vitest';
import {
  INITIAL_STATE,
  formatResult,
  executeOperation,
  inputDigit,
  inputDecimal,
  setOperation,
  calculate,
  clear,
  allClear
} from '../../src/core/calculator';
import type { CalculatorState, Operator } from '../../src/core/types';

describe('Core Calculator Logic', () => {
  describe('INITIAL_STATE', () => {
    it('should have initial default values', () => {
      expect(INITIAL_STATE.display).toBe('0');
      expect(INITIAL_STATE.previousValue).toBeNull();
      expect(INITIAL_STATE.operation).toBeNull();
      expect(INITIAL_STATE.overwrite).toBe(false);
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

    it('should throw on division by zero', () => {
      expect(() => executeOperation(10, 0, '/')).toThrow('Division by zero');
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

    it('should handle non-finite values gracefully', () => {
      expect(formatResult(Infinity)).toBe('Error');
      expect(formatResult(NaN)).toBe('Error');
    });
  });

  describe('inputDigit', () => {
    it('should replace initial zero with entered digit', () => {
      const state = inputDigit(INITIAL_STATE, '7');
      expect(state.display).toBe('7');
      expect(state.overwrite).toBe(false);
    });

    it('should append digits to existing number', () => {
      let state = inputDigit(INITIAL_STATE, '1');
      state = inputDigit(state, '2');
      state = inputDigit(state, '3');
      expect(state.display).toBe('123');
    });

    it('should replace display when overwrite is true', () => {
      const overwriteState: CalculatorState = {
        ...INITIAL_STATE,
        display: '50',
        previousValue: 50,
        operation: '+',
        overwrite: true
      };

      const state = inputDigit(overwriteState, '9');
      expect(state.display).toBe('9');
      expect(state.overwrite).toBe(false);
    });
  });

  describe('inputDecimal', () => {
    it('should append decimal point to integer display', () => {
      const state = inputDigit(INITIAL_STATE, '5');
      const withDecimal = inputDecimal(state);
      expect(withDecimal.display).toBe('5.');
    });

    it('should not allow multiple decimal points in display', () => {
      let state = inputDigit(INITIAL_STATE, '5');
      state = inputDecimal(state);
      state = inputDigit(state, '2');
      state = inputDecimal(state);
      expect(state.display).toBe('5.2');
    });

    it('should start with 0. when decimal is pressed while overwrite is true', () => {
      const overwriteState: CalculatorState = {
        ...INITIAL_STATE,
        display: '25',
        previousValue: 25,
        operation: '-',
        overwrite: true
      };
      const state = inputDecimal(overwriteState);
      expect(state.display).toBe('0.');
      expect(state.overwrite).toBe(false);
    });
  });

  describe('setOperation and consecutive operations', () => {
    it('should set operator and store previous value', () => {
      let state = inputDigit(INITIAL_STATE, '8');
      state = setOperation(state, '+');
      expect(state.operation).toBe('+');
      expect(state.previousValue).toBe(8);
      expect(state.overwrite).toBe(true);
    });

    it('should allow changing operator if next digit has not been entered', () => {
      let state = inputDigit(INITIAL_STATE, '8');
      state = setOperation(state, '+');
      state = setOperation(state, '*');
      expect(state.operation).toBe('*');
      expect(state.previousValue).toBe(8);
    });

    it('should calculate intermediate result on consecutive operations', () => {
      let state = inputDigit(INITIAL_STATE, '10');
      state = setOperation(state, '+');
      state = inputDigit(state, '5');
      state = setOperation(state, '*');
      expect(state.display).toBe('15');
      expect(state.previousValue).toBe(15);
      expect(state.operation).toBe('*');
      expect(state.overwrite).toBe(true);
    });
  });

  describe('calculate', () => {
    it('should compute final result and reset operator state', () => {
      let state = inputDigit(INITIAL_STATE, '10');
      state = setOperation(state, '-');
      state = inputDigit(state, '4');
      state = calculate(state);
      expect(state.display).toBe('6');
      expect(state.previousValue).toBeNull();
      expect(state.operation).toBeNull();
      expect(state.overwrite).toBe(true);
    });

    it('should not change state if calculate is pressed without operator', () => {
      const state = inputDigit(INITIAL_STATE, '42');
      const result = calculate(state);
      expect(result.display).toBe('42');
      expect(result.operation).toBeNull();
    });

    it('should set an error state on division by zero', () => {
      let state = inputDigit(INITIAL_STATE, '10');
      state = setOperation(state, '/');
      state = inputDigit(state, '0');
      state = calculate(state);
      expect(state.display).toBe('Error');
      expect(state.error).toBe('Division by zero');
    });

    it('should record the calculation in history', () => {
      let state = inputDigit(INITIAL_STATE, '10');
      state = setOperation(state, '-');
      state = inputDigit(state, '4');
      state = calculate(state);
      expect(state.history).toHaveLength(1);
      expect(state.history[0].expression).toBe('10 - 4');
      expect(state.history[0].result).toBe('6');
    });
  });

  describe('clear and allClear', () => {
    it('clear should reset the current entry only', () => {
      let state = inputDigit(INITIAL_STATE, '9');
      state = setOperation(state, '+');
      state = inputDigit(state, '3');
      const cleared = clear(state);
      expect(cleared.display).toBe('0');
      expect(cleared.overwrite).toBe(false);
      expect(cleared.error).toBeNull();
      // Pending operation is preserved (clear-entry semantics).
      expect(cleared.previousValue).toBe(9);
      expect(cleared.operation).toBe('+');
    });

    it('allClear should reset state to initial values', () => {
      let state = inputDigit(INITIAL_STATE, '9');
      state = setOperation(state, '+');
      state = inputDigit(state, '3');
      const cleared = allClear();
      expect(cleared.display).toBe('0');
      expect(cleared.previousValue).toBeNull();
      expect(cleared.operation).toBeNull();
      expect(cleared.overwrite).toBe(false);
      expect(cleared.error).toBeNull();
    });
  });

  // Keep the Operator import referenced for future operator-parametrized tests.
  it('exposes the operator type', () => {
    const op: Operator = '*';
    expect(executeOperation(6, 7, op)).toBe(42);
  });
});
