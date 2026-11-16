import { describe, expect, it } from 'vitest';

import { previewLine, round2 } from './financial.model';

describe('financial.model', () => {
  it('arredonda metade para cima, como o servidor', () => {
    expect(round2(945.189)).toBe(945.19);
    expect(round2(46.6662)).toBe(46.67);
    expect(round2(0.025)).toBe(0.03);
    expect(round2(1.005)).toBe(1.01);
  });

  it('calcula a linha com desconto e IVA (mesmo exemplo dos testes do backend)', () => {
    expect(previewLine(3, 2500.5, 10, 14)).toEqual({ net: 6751.35, vat: 945.19, gross: 7696.54 });
    expect(previewLine(1, 333.33, 0, 14)).toEqual({ net: 333.33, vat: 46.67, gross: 380 });
  });
});
