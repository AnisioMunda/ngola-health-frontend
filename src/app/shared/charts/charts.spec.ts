import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { BarList } from './bar-list';
import { formatTick, formatValue, niceTicks } from './chart-format';
import { ColumnChart } from './column-chart';

describe('chart-format', () => {
  it('divisões redondas que cobrem o máximo', () => {
    expect(niceTicks(87)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(4)).toEqual([0, 1, 2, 3, 4]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });

  it('valores em português; eixo compacto a partir de 10 mil', () => {
    expect(formatValue(1234.6, 'money')).toMatch(/^1.235 Kz$/);
    expect(formatValue(12.5, 'percent')).toBe('12,5%');
    expect(formatTick(2500)).toMatch(/^2.500$/);
    expect(formatTick(20000)).not.toContain('20000');
  });
});

describe('BarList', () => {
  function render(items: { label: string; value: number }[]) {
    TestBed.configureTestingModule({ imports: [BarList] });
    const fixture = TestBed.createComponent(BarList);
    fixture.componentRef.setInput('title', 'Episódios por tipo');
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('barras proporcionais ao maior valor, com rótulo e valor em texto', () => {
    const el = render([
      { label: 'Consulta', value: 40 },
      { label: 'Urgência', value: 10 },
    ]);
    const bars = [...el.querySelectorAll<HTMLElement>('.bar')];
    expect(bars.map((b) => b.style.width)).toEqual(['100%', '25%']);
    expect(el.querySelector('li')?.getAttribute('aria-label')).toBe('Consulta: 40');
    // A vista em tabela tem os mesmos dados.
    expect([...el.querySelectorAll('.table-view td')].map((td) => td.textContent?.trim())).toEqual([
      'Consulta',
      '40',
      'Urgência',
      '10',
    ]);
  });

  it('sem dados diz-o', () => {
    expect(render([]).textContent).toContain('Sem dados no período');
  });
});

describe('ColumnChart', () => {
  it('uma coluna por dia com valor e navegação por teclado', () => {
    TestBed.configureTestingModule({ imports: [ColumnChart] });
    const fixture = TestBed.createComponent(ColumnChart);
    fixture.componentRef.setInput('title', 'Episódios por dia');
    fixture.componentRef.setInput('points', [
      { date: '2026-11-16', value: 3 },
      { date: '2026-11-17', value: 0 },
      { date: '2026-11-18', value: 5 },
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // Dias a zero não desenham coluna, mas mantêm a zona de toque.
    expect(el.querySelectorAll('path.col').length).toBe(2);
    expect(el.querySelectorAll('rect.hit').length).toBe(3);
    const svg = el.querySelector('svg')!;
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(el.querySelector('.tooltip strong')?.textContent).toBe('5');
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(el.querySelector('.tooltip strong')?.textContent).toBe('0');
    expect(el.querySelectorAll('.table-view tbody tr').length).toBe(3);
  });
});
