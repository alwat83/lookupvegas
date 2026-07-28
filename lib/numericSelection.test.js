import { describe, it, expect } from 'vitest';
import { selectFiniteNumber } from './numericSelection.js';

describe('selectFiniteNumber', () => {
  it('preserves a legitimate zero', () => {
    expect(selectFiniteNumber(0, 450)).toBe(0);
  });

  it('preserves a positive finite number', () => {
    expect(selectFiniteNumber(480, 450)).toBe(480);
  });

  it('falls back to the fallback value on null', () => {
    expect(selectFiniteNumber(null, 450)).toBe(450);
  });

  it('falls back on undefined (including a missing property)', () => {
    expect(selectFiniteNumber(undefined, 450)).toBe(450);
    const doc = {};
    expect(selectFiniteNumber(doc.flight_arrivals_total, 450)).toBe(450);
  });

  it('falls back on NaN', () => {
    expect(selectFiniteNumber(NaN, 450)).toBe(450);
  });

  it('falls back on positive and negative Infinity', () => {
    expect(selectFiniteNumber(Infinity, 450)).toBe(450);
    expect(selectFiniteNumber(-Infinity, 450)).toBe(450);
  });

  it('falls back on wrong types: string, object, array, boolean', () => {
    expect(selectFiniteNumber('480', 450)).toBe(450);
    expect(selectFiniteNumber('', 450)).toBe(450);
    expect(selectFiniteNumber({}, 450)).toBe(450);
    expect(selectFiniteNumber([], 450)).toBe(450);
    expect(selectFiniteNumber(true, 450)).toBe(450);
  });

  it('rejects a negative count by default, since counts cannot legitimately be negative', () => {
    expect(selectFiniteNumber(-5, 450)).toBe(450);
  });

  it('preserves a negative value when the field explicitly allows it', () => {
    expect(selectFiniteNumber(-5, 0, { allowNegative: true })).toBe(-5);
  });

  it('still rejects non-finite values even when negatives are allowed', () => {
    expect(selectFiniteNumber(-Infinity, 0, { allowNegative: true })).toBe(0);
    expect(selectFiniteNumber(NaN, 0, { allowNegative: true })).toBe(0);
  });
});
