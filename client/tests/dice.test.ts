import { describe, it, expect } from 'vitest';
import { rollDice, isValidNotation, MAX_DICE } from '../src/dice';

/** Deterministic rng cycling through the given values (each in [0, 1)). */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('rollDice', () => {
  it('rolls a plain die with an implicit count of 1', () => {
    const r = rollDice('d20', seq(0.999));
    expect(r.terms).toHaveLength(1);
    expect(r.terms[0].rolls).toEqual([20]);
    expect(r.total).toBe(20);
  });

  it('rolls NdM plus a constant', () => {
    // 0.999 → 6, 0 → 1 on a d6
    const r = rollDice('2d6+3', seq(0.999, 0));
    expect(r.terms[0].rolls).toEqual([6, 1]);
    expect(r.total).toBe(6 + 1 + 3);
  });

  it('handles subtraction and multiple dice terms', () => {
    // d8 → 8, d4 → 1
    const r = rollDice('1d8-1d4-2', seq(0.999, 0));
    expect(r.total).toBe(8 - 1 - 2);
  });

  it('keeps the highest dice with kh', () => {
    // d6 rolls: 1, 4, 6, 4
    const r = rollDice('4d6kh3', seq(0, 0.5, 0.999, 0.5));
    expect(r.terms[0].rolls).toEqual([1, 4, 6, 4]);
    expect(r.terms[0].kept.slice().sort((a, b) => b - a)).toEqual([6, 4, 4]);
    expect(r.total).toBe(14);
  });

  it('keeps the lowest dice with kl', () => {
    // d20 rolls: 20, 1
    const r = rollDice('2d20kl1', seq(0.999, 0));
    expect(r.total).toBe(1);
  });

  it('models advantage as 2d20kh1 plus modifier', () => {
    const r = rollDice('2d20kh1+5', seq(0.2, 0.7)); // rolls 5 and 15
    expect(r.total).toBe(15 + 5);
  });

  it('evaluates a bare constant', () => {
    expect(rollDice('7').total).toBe(7);
  });

  it('ignores whitespace and case', () => {
    const r = rollDice(' 2D6 + 3 ', seq(0, 0));
    expect(r.total).toBe(1 + 1 + 3);
  });

  it('always rolls within die bounds', () => {
    for (let i = 0; i < 200; i++) {
      const r = rollDice('3d6');
      for (const roll of r.terms[0].rolls) {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      }
    }
  });

  it('produces a readable breakdown', () => {
    const r = rollDice('2d6+3', seq(0.999, 0));
    expect(r.breakdown).toContain('2d6 [6, 1]');
    expect(r.breakdown).toContain('+ 3');
  });

  it.each(['', '   ', 'abc', '2d', 'd', '2x6', '2d6++3', '2d6+', '1d6kh', 'kh3'])(
    'rejects invalid notation %j',
    (bad) => {
      expect(() => rollDice(bad)).toThrow();
    }
  );

  it('rejects out-of-range dice', () => {
    expect(() => rollDice(`${MAX_DICE + 1}d6`)).toThrow(/count/i);
    expect(() => rollDice('1d1')).toThrow(/sides/i);
    expect(() => rollDice('0d6')).toThrow(/count/i);
    expect(() => rollDice('2d6kh3')).toThrow(/keep/i);
    expect(() => rollDice('2d6kh0')).toThrow(/keep/i);
  });
});

describe('isValidNotation', () => {
  it.each(['1d20', '2d6+3', '4d6kh3', '2d20kl1+2', '5'])('accepts %s', (good) => {
    expect(isValidNotation(good)).toBe(true);
  });

  it.each(['', 'banana', '2d6**', '999d999999'])('rejects %j', (bad) => {
    expect(isValidNotation(bad)).toBe(false);
  });
});
