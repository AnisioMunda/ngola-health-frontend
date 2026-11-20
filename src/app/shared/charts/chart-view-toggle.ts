import { ChangeDetectionStrategy, Component, model } from '@angular/core';

/** Alterna entre o gráfico e a tabela com os mesmos dados (controlo segmentado). */
@Component({
  selector: 'app-chart-view-toggle',
  template: `
    <div class="view-toggle" role="group" aria-label="Ver como">
      <button
        type="button"
        [class.active]="view() === 'chart'"
        [attr.aria-pressed]="view() === 'chart'"
        aria-label="Gráfico"
        title="Ver como gráfico"
        (click)="view.set('chart')"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2.5 13.5h11M4.5 11V7.5M8 11V4.5M11.5 11V8.5" />
        </svg>
        <span class="text">Gráfico</span>
      </button>
      <button
        type="button"
        [class.active]="view() === 'table'"
        [attr.aria-pressed]="view() === 'table'"
        aria-label="Tabela"
        title="Ver como tabela"
        (click)="view.set('table')"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
          <path d="M2.5 6.5h11M2.5 9.75h11M6.5 6.5V13" />
        </svg>
        <span class="text">Tabela</span>
      </button>
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }

    .view-toggle {
      display: inline-flex;
      gap: 0.15rem;
      padding: 0.15rem;
      background: #f3f7f6;
      border: 1px solid #e4ebea;
      border-radius: 0.6rem;
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      min-height: 1.75rem;
      padding: 0.2rem 0.55rem;
      color: #6b7b82;
      background: transparent;
      border: 0;
      border-radius: 0.45rem;
      font: inherit;
      font-size: 0.72rem;
      font-weight: 650;
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

    /* Cartão estreito: só os ícones, para o título não partir em duas linhas. */
    @container chart (max-width: 24rem) {
      button {
        padding-inline: 0.45rem;
      }

      .text {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }
    }

    svg {
      width: 0.9rem;
      height: 0.9rem;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.4;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartViewToggle {
  readonly view = model<'chart' | 'table'>('chart');
}
