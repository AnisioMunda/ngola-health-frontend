import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { StatCard } from './stat-card';

@Component({
  imports: [StatCard],
  template: `
    <app-stat-card
      label="Ocupação de camas"
      value="31,6%"
      tone="blue"
      [progress]="31.6"
      [meta]="['6 de 19 camas ocupadas', 'demora média 4 dias']"
    >
      <svg icon viewBox="0 0 24 24"><path d="M3 18h18" /></svg>
    </app-stat-card>
  `,
})
class Host {}

describe('StatCard', () => {
  it('mostra rótulo, valor, progresso e detalhes, com o estilo de cartão partilhado', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const card = (fixture.nativeElement as HTMLElement).querySelector('app-stat-card')!;

    expect(card.classList).toContain('card');
    expect(card.getAttribute('data-tone')).toBe('blue');
    expect(card.querySelector('.label')?.textContent).toBe('Ocupação de camas');
    expect(card.querySelector('.value')?.textContent?.trim()).toBe('31,6%');
    expect(card.querySelector('.icon svg')).not.toBeNull();
    expect(card.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('31.6');
    expect([...card.querySelectorAll('.meta li')].map((li) => li.textContent)).toEqual([
      '6 de 19 camas ocupadas',
      'demora média 4 dias',
    ]);
    expect(card.getAttribute('aria-label')).toBe(
      'Ocupação de camas, 31,6%, 6 de 19 camas ocupadas, demora média 4 dias',
    );
  });
});
