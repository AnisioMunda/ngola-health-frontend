import { describe, expect, it } from 'vitest';

import { changeRows, dayStartIso, formatValue, isEdit } from './audit-format';

describe('formatação da auditoria', () => {
  it('converte diferenças em linhas antes/depois com nomes legíveis', () => {
    const changes = {
      fullName: { from: 'Ana', to: 'Ana Silva' },
      email: { from: null, to: 'a@x.ao' },
    };
    expect(isEdit(changes)).toBe(true);
    expect(changeRows(changes)).toEqual([
      { field: 'fullName', label: 'Nome completo', from: 'Ana', to: 'Ana Silva' },
      { field: 'email', label: 'Correio electrónico', from: '—', to: 'a@x.ao' },
    ]);
  });

  it('mostra dados iniciais de uma criação', () => {
    const changes = { code: 'HCL-001', roles: ['ADMIN', 'MANAGER'], active: true };
    expect(isEdit(changes)).toBe(false);
    expect(changeRows(changes).map((r) => r.to)).toEqual(['HCL-001', 'ADMIN, MANAGER', 'Sim']);
  });

  it('formata valores vazios e booleanos', () => {
    expect(formatValue(null)).toBe('—');
    expect(formatValue('')).toBe('—');
    expect(formatValue(false)).toBe('Não');
    expect(changeRows(null)).toEqual([]);
  });

  it('converte datas locais no início do dia (e do dia seguinte, exclusivo)', () => {
    const start = new Date(dayStartIso('2026-11-10')!);
    const end = new Date(dayStartIso('2026-11-10', true)!);
    expect(start.getDate()).toBe(10);
    expect(start.getHours()).toBe(0);
    expect(end.getTime() - start.getTime()).toBe(24 * 3600 * 1000);
    expect(dayStartIso('10/11/2026')).toBeUndefined();
  });
});
