import { describe, it, expect } from 'vitest';
import { businessDateString, previousBusinessDateString, isValidBusinessDateString } from './businessDate.js';

describe('businessDateString', () => {
  it('resolves to the prior Pacific calendar day for a UTC instant just after UTC midnight', () => {
    // 2026-03-10T06:30:00Z is 2026-03-09 23:30 Pacific (PDT, UTC-7) --
    // still March 9th locally, already March 10th UTC.
    expect(businessDateString(new Date('2026-03-10T06:30:00Z'))).toBe('2026-03-09');
  });

  it('resolves correctly across a UTC midnight boundary in standard time', () => {
    // 2026-01-01T07:30:00Z is 2025-12-31 23:30 Pacific (PST, UTC-8).
    expect(businessDateString(new Date('2026-01-01T07:30:00Z'))).toBe('2025-12-31');
  });

  it('agrees with the UTC date once well past the Pacific offset', () => {
    // 2026-06-15T20:00:00Z is 2026-06-15 13:00 Pacific (PDT, UTC-7) --
    // same calendar date in both zones at this hour.
    expect(businessDateString(new Date('2026-06-15T20:00:00Z'))).toBe('2026-06-15');
  });
});

describe('previousBusinessDateString', () => {
  it('subtracts a plain calendar day', () => {
    expect(previousBusinessDateString('2026-07-15')).toBe('2026-07-14');
  });

  it('rolls back across a month boundary', () => {
    expect(previousBusinessDateString('2026-03-01')).toBe('2026-02-28');
  });

  it('rolls back across a year boundary', () => {
    expect(previousBusinessDateString('2026-01-01')).toBe('2025-12-31');
  });

  it('rolls back onto leap day correctly (2028 is a leap year)', () => {
    expect(previousBusinessDateString('2028-03-01')).toBe('2028-02-29');
  });

  it('rolls back off leap day correctly', () => {
    expect(previousBusinessDateString('2028-02-29')).toBe('2028-02-28');
  });

  it('is unaffected by DST transitions -- it never re-enters a timezone conversion', () => {
    // US DST began 2026-03-08 and ends 2026-11-01. Neither transition
    // should perturb pure calendar-day subtraction.
    expect(previousBusinessDateString('2026-03-08')).toBe('2026-03-07');
    expect(previousBusinessDateString('2026-11-01')).toBe('2026-10-31');
  });
});

describe('isValidBusinessDateString', () => {
  it('accepts a well-formed date', () => {
    expect(isValidBusinessDateString('2026-07-28')).toBe(true);
  });

  it('rejects malformed strings', () => {
    expect(isValidBusinessDateString('2026/07/28')).toBe(false);
    expect(isValidBusinessDateString('07-28-2026')).toBe(false);
    expect(isValidBusinessDateString('not-a-date')).toBe(false);
    expect(isValidBusinessDateString('')).toBe(false);
    expect(isValidBusinessDateString(undefined)).toBe(false);
  });

  it('rejects a calendar date that does not exist, including a false leap day', () => {
    expect(isValidBusinessDateString('2026-02-29')).toBe(false); // 2026 is not a leap year
    expect(isValidBusinessDateString('2026-04-31')).toBe(false); // April has 30 days
    expect(isValidBusinessDateString('2026-13-01')).toBe(false);
  });

  it('accepts a real leap day', () => {
    expect(isValidBusinessDateString('2028-02-29')).toBe(true);
  });
});
