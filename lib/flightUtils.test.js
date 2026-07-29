import { describe, it, expect } from 'vitest';
import { classifyAircraft, isPrivateJet } from './flightUtils.js';

describe('classifyAircraft', () => {
  it('classifies a known business-jet ICAO type as Private regardless of callsign', () => {
    expect(classifyAircraft('C56X', 'N123AB')).toBe('Private');
  });

  it('classifies a normal airline callsign as Commercial', () => {
    expect(classifyAircraft('B738', 'SWA1234')).toBe('Commercial');
  });

  it('classifies a known cargo callsign as Cargo', () => {
    expect(classifyAircraft('B763', 'FDX1234')).toBe('Cargo');
  });

  it('classifies a military aircraft with no matching pattern as Other, not Private', () => {
    expect(classifyAircraft('C130', '')).toBe('Other');
  });

  it('classifies a helicopter with an N-number as Private (known, pre-existing limitation)', () => {
    // Rotorcraft with N-number registrations are indistinguishable from
    // fixed-wing business jets under a pure registration-pattern
    // fallback. This is inherited from the existing authoritative
    // implementation, not introduced or fixed by LV-007.
    expect(classifyAircraft('EC35', 'N911MD')).toBe('Private');
  });

  it('classifies a small general-aviation piston aircraft with an N-number as Private (same known limitation)', () => {
    expect(classifyAircraft('C172', 'N738DK')).toBe('Private');
  });

  it('classifies a business jet type with no callsign at all as Private', () => {
    expect(classifyAircraft('GLF5', '')).toBe('Private');
    expect(classifyAircraft('GLF5', null)).toBe('Private');
    expect(classifyAircraft('GLF5', undefined)).toBe('Private');
  });

  it('classifies an airline callsign with a missing/unknown type as Commercial via callsign alone', () => {
    expect(classifyAircraft(null, 'JBU2001')).toBe('Commercial');
    expect(classifyAircraft(undefined, 'JBU2001')).toBe('Commercial');
  });

  it('normalizes lowercase and padded-whitespace fields identically to clean uppercase input', () => {
    expect(classifyAircraft('c56x', '  n456cd  ')).toBe('Private');
    expect(classifyAircraft('C56X', 'N456CD')).toBe('Private');
  });

  it('does not treat a misleading six-character N-callsign on a known commercial type as Private', () => {
    // A CRJ200 is a regional commercial jet -- the type-based commercial
    // exclusion must win over the N-number fallback pattern.
    expect(classifyAircraft('CRJ2', 'N123CR')).toBe('Commercial');
  });

  it('applies the B7/A3/E7/CRJ commercial type-prefix rule even without a matching callsign', () => {
    expect(classifyAircraft('B78X', 'UNKNOWN')).toBe('Commercial');
    expect(classifyAircraft('A359', 'UNKNOWN')).toBe('Commercial'); // starts with 'A3' -- the actual rule prefix
    expect(classifyAircraft('E75L', 'UNKNOWN')).toBe('Commercial');
  });

  it('handles null and undefined for both arguments without throwing', () => {
    expect(classifyAircraft(null, null)).toBe('Other');
    expect(classifyAircraft(undefined, undefined)).toBe('Other');
  });

  it('handles an empty object passed as a malformed type or callsign without throwing', () => {
    expect(() => classifyAircraft({}, {})).not.toThrow();
    expect(classifyAircraft({}, {})).toBe('Other');
  });

  it('handles a fully malformed aircraft-shaped object (numbers, arrays) without throwing', () => {
    expect(() => classifyAircraft(12345, ['N123AB'])).not.toThrow();
    expect(classifyAircraft(12345, ['N123AB'])).toBe('Other');
  });

  it('handles two empty strings as Other', () => {
    expect(classifyAircraft('', '')).toBe('Other');
  });
});

describe('isPrivateJet', () => {
  it('is a thin boolean wrapper around classifyAircraft, not a second implementation', () => {
    expect(isPrivateJet('C56X', 'N123AB')).toBe(true);
    expect(isPrivateJet('B738', 'SWA1234')).toBe(false);
    expect(isPrivateJet('B763', 'FDX1234')).toBe(false); // Cargo -- not Private
    expect(isPrivateJet(null, null)).toBe(false);
    expect(isPrivateJet({}, {})).toBe(false); // malformed input -- safe, no throw
  });
});

describe('LV-007 disagreement quantification', () => {
  // A reference reimplementation of the OLD cron inline heuristic, kept
  // ONLY in this test file to make the quantified disagreement in
  // docs/LV-007-private-jet-classification.md objectively re-verifiable.
  // This is not reintroduced anywhere in production code.
  function oldCronHeuristic(type, callsign) {
    const cs = callsign ? callsign.trim() : '';
    return cs.startsWith('N') && cs.length <= 6;
  }

  const fixtures = [
    { name: 'US-registered business jet, N callsign', type: 'C56X', callsign: 'N123AB', expectDisagree: false },
    { name: 'airline flight, normal callsign', type: 'B738', callsign: 'SWA1234', expectDisagree: false },
    { name: 'cargo flight', type: 'B763', callsign: 'FDX1234', expectDisagree: false },
    { name: 'military aircraft, no callsign', type: 'C130', callsign: '', expectDisagree: false },
    { name: 'helicopter, N-registered', type: 'EC35', callsign: 'N911MD', expectDisagree: false },
    { name: 'GA piston, N-registered', type: 'C172', callsign: 'N738DK', expectDisagree: false },
    { name: 'business jet, no callsign', type: 'GLF5', callsign: '', expectDisagree: true },
    { name: 'airline callsign, missing type', type: null, callsign: 'JBU2001', expectDisagree: false },
    { name: 'lowercase/padded business jet', type: 'c56x', callsign: '  n456cd  ', expectDisagree: true },
    { name: 'misleading six-char N callsign on a regional jet', type: 'CRJ2', callsign: 'N123CR', expectDisagree: true },
    { name: 'business jet, non-N executive callsign', type: 'GLF6', callsign: 'EXEC42', expectDisagree: true },
  ];

  it('reproduces exactly the documented 4-of-11 disagreement count between the old heuristic and the authoritative classifier', () => {
    let disagreements = 0;
    for (const f of fixtures) {
      const oldResult = oldCronHeuristic(f.type, f.callsign);
      const newResult = isPrivateJet(f.type, f.callsign);
      const disagrees = oldResult !== newResult;
      if (disagrees) disagreements++;
      expect(disagrees).toBe(f.expectDisagree);
    }
    expect(disagreements).toBe(4);
  });
});
