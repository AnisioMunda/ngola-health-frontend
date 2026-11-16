import { describe, expect, it } from 'vitest';

import { Admission, Ward, canStillCancel, occupancy } from './inpatient.model';

describe('inpatient.model', () => {
  it('ocupação em percentagem das camas activas', () => {
    expect(occupancy({ beds: 4, occupied: 3 } as Ward)).toBe(75);
    expect(occupancy({ beds: 0, occupied: 0 } as Ward)).toBe(0);
  });

  it('anulação só nas primeiras 24 horas', () => {
    const now = new Date('2026-11-16T12:00:00Z');
    expect(canStillCancel({ admittedAt: '2026-11-16T00:00:00Z' } as Admission, now)).toBe(true);
    expect(canStillCancel({ admittedAt: '2026-11-15T11:00:00Z' } as Admission, now)).toBe(false);
  });
});
