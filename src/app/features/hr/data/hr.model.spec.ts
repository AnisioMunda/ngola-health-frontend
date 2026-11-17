import { describe, expect, it } from 'vitest';

import { addDaysIso, hours, mondayOf } from './hr.model';

describe('hr.model', () => {
  it('formata minutos como horas', () => {
    expect(hours(485)).toBe('8h05');
    expect(hours(0)).toBe('0h00');
    expect(hours(null)).toBe('—');
  });

  it('segunda-feira da semana', () => {
    expect(mondayOf('2026-11-19')).toBe('2026-11-16');
    expect(mondayOf('2026-11-22')).toBe('2026-11-16');
    expect(mondayOf('2026-11-16')).toBe('2026-11-16');
    expect(addDaysIso('2026-11-30', 7)).toBe('2026-12-07');
  });
});
