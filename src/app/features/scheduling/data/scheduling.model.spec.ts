import { describe, expect, it } from 'vitest';

import { addDays, hhmm, isPending } from './scheduling.model';

describe('scheduling.model', () => {
  it('soma dias atravessando meses e anos', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('mostra só horas e minutos', () => {
    expect(hhmm('09:30:00')).toBe('09:30');
    expect(hhmm(null)).toBe('');
  });

  it('só marcadas e confirmadas estão por atender', () => {
    expect(isPending('SCHEDULED')).toBe(true);
    expect(isPending('CONFIRMED')).toBe(true);
    expect(isPending('CHECKED_IN')).toBe(false);
    expect(isPending('CANCELLED')).toBe(false);
  });
});
