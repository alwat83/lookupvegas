import { describe, it, expect } from 'vitest';
import { businessDateString, addDays, weeklyBusinessDateRange } from './businessDate.js';

const TZ = 'America/Los_Angeles';

describe('businessDateString', () => {
  it('resolves an ordinary winter date (PST, UTC-8)', () => {
    // 2026-01-15T20:00:00Z is 2026-01-15 12:00 PST.
    expect(businessDateString(new Date('2026-01-15T20:00:00Z'), TZ)).toBe('2026-01-15');
  });

  it('resolves an ordinary summer date (PDT, UTC-7)', () => {
    // 2026-07-15T20:00:00Z is 2026-07-15 13:00 PDT.
    expect(businessDateString(new Date('2026-07-15T20:00:00Z'), TZ)).toBe('2026-07-15');
  });

  it('resolves exact local midnight correctly', () => {
    // 2026-07-15 00:00:00 Pacific (PDT, UTC-7) is 2026-07-15T07:00:00Z.
    expect(businessDateString(new Date('2026-07-15T07:00:00Z'), TZ)).toBe('2026-07-15');
  });

  it('resolves the instant just before local midnight to the prior day', () => {
    // 2026-07-14 23:59:59 Pacific is 2026-07-15T06:59:59Z.
    expect(businessDateString(new Date('2026-07-15T06:59:59Z'), TZ)).toBe('2026-07-14');
  });

  it('resolves the instant just after local midnight to the new day', () => {
    // 2026-07-15 00:00:01 Pacific is 2026-07-15T07:00:01Z.
    expect(businessDateString(new Date('2026-07-15T07:00:01Z'), TZ)).toBe('2026-07-15');
  });
});

describe('addDays', () => {
  it('subtracts a plain calendar day', () => {
    expect(addDays('2026-07-15', -6)).toBe('2026-07-09');
  });

  it('rolls forward across a month boundary', () => {
    expect(addDays('2026-01-30', 5)).toBe('2026-02-04');
  });

  it('rolls backward across a year boundary', () => {
    expect(addDays('2026-01-02', -6)).toBe('2025-12-27');
  });

  it('handles a leap day correctly (2028 is a leap year)', () => {
    expect(addDays('2028-02-27', 2)).toBe('2028-02-29');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('is unaffected by DST transitions -- it never re-enters a timezone conversion', () => {
    // Spring-forward 2026-03-08 and fall-back 2026-11-01.
    expect(addDays('2026-03-05', 3)).toBe('2026-03-08');
    expect(addDays('2026-11-04', -3)).toBe('2026-11-01');
  });
});

describe('weeklyBusinessDateRange', () => {
  it('returns a 7-day inclusive range ending on the reference instant\'s Las Vegas business date', () => {
    // Monday 2026-07-20 08:00 Pacific (PDT) -> 2026-07-20T15:00:00Z.
    const result = weeklyBusinessDateRange(new Date('2026-07-20T15:00:00Z'), TZ);
    expect(result).toEqual({ start: '2026-07-14', end: '2026-07-20' });
  });

  it('resolves correctly across a month boundary', () => {
    // Monday 2026-03-02 08:00 Pacific (PST) -> 2026-03-02T16:00:00Z.
    const result = weeklyBusinessDateRange(new Date('2026-03-02T16:00:00Z'), TZ);
    expect(result).toEqual({ start: '2026-02-24', end: '2026-03-02' });
  });

  it('resolves correctly across a year boundary', () => {
    // Monday 2026-01-05 08:00 Pacific (PST) -> 2026-01-05T16:00:00Z.
    const result = weeklyBusinessDateRange(new Date('2026-01-05T16:00:00Z'), TZ);
    expect(result).toEqual({ start: '2025-12-30', end: '2026-01-05' });
  });

  it('resolves correctly across a leap day', () => {
    // Monday 2028-03-06 08:00 Pacific (PDT) -> 2028-03-06T15:00:00Z.
    const result = weeklyBusinessDateRange(new Date('2028-03-06T15:00:00Z'), TZ);
    expect(result).toEqual({ start: '2028-02-29', end: '2028-03-06' });
  });

  it('resolves correctly for a run during the spring-forward DST transition week', () => {
    // US DST began 2026-03-08. Monday 2026-03-09 08:00 Pacific (now PDT,
    // UTC-7) -> 2026-03-09T15:00:00Z.
    const result = weeklyBusinessDateRange(new Date('2026-03-09T15:00:00Z'), TZ);
    expect(result).toEqual({ start: '2026-03-03', end: '2026-03-09' });
  });

  it('resolves correctly for a run during the fall-back DST transition week', () => {
    // US DST ends 2026-11-01. Monday 2026-11-02 08:00 Pacific (now PST,
    // UTC-8) -> 2026-11-02T16:00:00Z.
    const result = weeklyBusinessDateRange(new Date('2026-11-02T16:00:00Z'), TZ);
    expect(result).toEqual({ start: '2026-10-27', end: '2026-11-02' });
  });

  it('selects the Sunday-local business date even when UTC has already rolled to Monday', () => {
    // 2026-07-20T05:00:00Z is 2026-07-19 22:00 Pacific (PDT) -- UTC is
    // already Monday the 20th, but Las Vegas is still Sunday the 19th.
    // Pacific is always behind UTC, so this is the only direction such a
    // mismatch can occur for this zone -- Vegas can never be ahead of UTC.
    const result = weeklyBusinessDateRange(new Date('2026-07-20T05:00:00Z'), TZ);
    expect(result.end).toBe('2026-07-19');
    expect(result.start).toBe('2026-07-13');
  });

  it('agrees with the UTC date once well away from the boundary, for a sanity check', () => {
    const result = weeklyBusinessDateRange(new Date('2026-07-20T20:00:00Z'), TZ);
    expect(result.end).toBe('2026-07-20');
  });
});
