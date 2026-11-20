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

/** Número de dias do período, contando o primeiro e o último. */
export function periodDays(period: Period): number {
  const ms = Date.parse(`${period.to}T00:00:00Z`) - Date.parse(`${period.from}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * Filtro de período: períodos rápidos (controlo segmentado) e intervalo de datas numa só linha.
 * Não desenha cartão próprio: fica dentro do contentor de quem o usa.
 */
@Component({
  selector: 'app-period-picker',
  imports: [FormsModule],
  template: `
    <div class="period-picker">
      <div class="presets" role="group" aria-label="Períodos rápidos">
        @for (p of presets; track p.days) {
          <button
            type="button"
            class="preset"
            [class.active]="isPreset(p.days)"
            [attr.aria-pressed]="isPreset(p.days)"
            (click)="period.set(lastDays(p.days))"
          >
            {{ p.label }}
          </button>
        }
      </div>

      <div class="range" role="group" aria-label="Intervalo de datas">
        <label class="range-field">
          <span>De</span>
          <input
            type="date"
            name="from"
            [max]="period().to"
            [ngModel]="period().from"
            (ngModelChange)="set('from', $event)"
          />
        </label>
        <svg class="range-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 10h12m-5-5 5 5-5 5" />
        </svg>
        <label class="range-field">
          <span>Até</span>
          <input
            type="date"
            name="to"
            [min]="period().from"
            [ngModel]="period().to"
            (ngModelChange)="set('to', $event)"
          />
        </label>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    /* Quem usa o filtro escolhe o alinhamento (--period-picker-justify); por omissão à direita. */
    .period-picker {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: var(--period-picker-justify, flex-end);
      gap: 0.75rem;
    }

    /* Controlo segmentado: um só contorno, o período activo em destaque. */
    .presets {
      display: inline-flex;
      gap: 0.2rem;
      padding: 0.2rem;
      background: #f3f7f6;
      border: 1px solid #e4ebea;
      border-radius: 0.7rem;
    }

    .preset {
      min-height: 2rem;
      padding: 0.3rem 0.8rem;
      color: #53666d;
      background: transparent;
      border: 0;
      border-radius: 0.5rem;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition:
        background 150ms ease,
        color 150ms ease,
        box-shadow 150ms ease;

      &:hover:not(.active) {
        color: #23665f;
        background: #e9f2f0;
      }

      &.active {
        color: #0e6f62;
        background: #fff;
        box-shadow:
          0 1px 2px rgba(23, 43, 53, 0.08),
          0 0 0 1px #cfe5df;
      }

      &:focus-visible {
        outline: 2px solid #0e8979;
        outline-offset: 2px;
      }
    }

    /* Intervalo: De → Até, numa linha, com a mesma altura do controlo segmentado. */
    .range {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.35rem;
      background: #fff;
      border: 1px solid #e4ebea;
      border-radius: 0.7rem;
      transition: border-color 150ms ease;

      &:focus-within {
        border-color: #b9dcd3;
      }
    }

    .range-field {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding-left: 0.45rem;

      span {
        color: #849397;
        font-size: 0.68rem;
        font-weight: 750;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      input {
        min-height: 2rem;
        padding: 0.25rem 0.45rem;
        color: #172b35;
        background: transparent;
        border: 0;
        border-radius: 0.45rem;
        font: inherit;
        font-size: 0.82rem;
        font-variant-numeric: tabular-nums;

        &:hover {
          background: #f3f7f6;
        }

        &:focus-visible {
          outline: 2px solid #0e8979;
          outline-offset: 0;
        }
      }
    }

    .range-arrow {
      width: 0.9rem;
      height: 0.9rem;
      flex: 0 0 auto;
      color: #a7b3b5;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.5;
    }

    /* Telemóvel: períodos a toda a largura; datas em duas colunas, com o rótulo por cima. */
    @media (max-width: 480px) {
      .period-picker {
        flex-direction: column;
        align-items: stretch;
      }

      .presets {
        display: flex;
      }

      .preset {
        min-width: 0;
        flex: 1;
        padding-inline: 0.25rem;
      }

      .range {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        padding: 0.35rem 0.5rem 0.45rem;
      }

      .range-field {
        min-width: 0;
        flex-direction: column;
        align-items: stretch;
        gap: 0.1rem;
        padding-left: 0;

        input {
          width: 100%;
          min-width: 0;
          padding-inline: 0.2rem;
        }
      }

      .range-arrow {
        margin-top: 1rem;
      }
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
    if (!value) return;
    const next = { ...this.period(), [field]: value };
    // Nunca deixa o início depois do fim.
    if (next.from > next.to) return;
    this.period.set(next);
  }
}
