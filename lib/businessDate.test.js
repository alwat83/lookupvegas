import { describe, it, expect } from 'vitest';
import { businessDateString } from './businessDate.js';

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
