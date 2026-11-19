import { describe, expect, it } from 'vitest';

import { PageTotalPipe } from './page';

describe('PageTotalPipe', () => {
  const pipe = new PageTotalPipe();

  it('mostra o total exacto', () => {
    expect(pipe.transform({ totalElements: 37 })).toBe('37');
    expect(pipe.transform({ totalElements: 37, totalCapped: false })).toBe('37');
  });

  it('mostra "mais de" quando o backend truncou a contagem', () => {
    expect(pipe.transform({ totalElements: 1000, totalCapped: true }).replace(/\s/g, ' ')).toBe(
      'mais de 1 000',
    );
  });
});
