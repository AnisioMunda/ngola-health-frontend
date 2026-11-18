import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Period } from './data/reports.service';

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Os últimos {@code days} dias, incluindo hoje. */
export function lastDays(days: number): Period {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: iso(from), to: iso(to) };
}

/** Filtro de período (uma só linha, por cima de todos os gráficos). */
@Component({
  selector: 'app-period-picker',
  imports: [FormsModule],
  template: `
    <div class="filters card" role="group" aria-label="Período">
      @for (p of presets; track p.days) {
        <button
          type="button"
          class="btn btn-small btn-secondary"
          [attr.aria-pressed]="isPreset(p.days)"
          (click)="period.set(lastDays(p.days))"
        >
          {{ p.label }}
        </button>
      }
      <label class="field"
        ><span>De</span
        ><input
          type="date"
          name="from"
          [ngModel]="period().from"
          (ngModelChange)="set('from', $event)"
      /></label>
      <label class="field"
        ><span>Até</span
        ><input type="date" name="to" [ngModel]="period().to" (ngModelChange)="set('to', $event)"
      /></label>
    </div>
  `,
  styles: `
    button[aria-pressed='true'] {
      background: var(--color-primary-soft);
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodPicker {
  readonly period = model.required<Period>();

  protected readonly presets = [
    { days: 7, label: '7 dias' },
    { days: 30, label: '30 dias' },
    { days: 90, label: '90 dias' },
    { days: 365, label: '12 meses' },
  ];
  protected readonly lastDays = lastDays;

  protected isPreset(days: number): boolean {
    const p = lastDays(days);
    return p.from === this.period().from && p.to === this.period().to;
  }

  protected set(field: 'from' | 'to', value: string): void {
    if (value) this.period.set({ ...this.period(), [field]: value });
  }
}
