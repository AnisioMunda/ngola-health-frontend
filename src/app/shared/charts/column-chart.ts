import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { ValueFormat, formatTick, formatValue, niceTicks } from './chart-format';

export interface ColumnPoint {
  /** Data ISO (yyyy-MM-dd). */
  date: string;
  value: number;
}

const WIDTH = 640;
const HEIGHT = 200;
const PAD = { top: 12, right: 8, bottom: 24, left: 56 };

/**
 * Colunas diárias de uma só série (evolução no tempo). Cada coluna tem a faixa inteira como zona
 * de toque; setas ←/→ percorrem os dias com o teclado. Inclui a vista em tabela.
 */
@Component({
  selector: 'app-column-chart',
  imports: [DatePipe],
  template: `
    <figure class="column-chart">
      <figcaption class="chart-title">{{ title() }}</figcaption>
      @if (points().length === 0) {
        <p class="muted">Sem dados no período.</p>
      } @else {
        <div class="plot">
          <svg
            [attr.viewBox]="'0 0 ' + width + ' ' + height"
            role="img"
            tabindex="0"
            [attr.aria-label]="title() + '. Use as setas para percorrer os dias.'"
            (keydown)="onKey($event)"
            (blur)="active.set(null)"
            (mouseleave)="active.set(null)"
          >
            @for (t of ticks(); track t) {
              <line
                class="grid"
                [attr.x1]="pad.left"
                [attr.x2]="width - pad.right"
                [attr.y1]="y(t)"
                [attr.y2]="y(t)"
              />
              <text class="tick" [attr.x]="pad.left - 6" [attr.y]="y(t) + 4" text-anchor="end">
                {{ tick(t) }}
              </text>
            }
            @for (p of points(); track p.date; let i = $index) {
              <g (mouseenter)="active.set(i)">
                <rect
                  class="hit"
                  [attr.x]="bandX(i)"
                  [attr.y]="pad.top"
                  [attr.width]="band()"
                  [attr.height]="plotHeight"
                />
                @if (p.value > 0) {
                  <path class="col" [class.active]="active() === i" [attr.d]="column(i, p.value)" />
                }
              </g>
            }
            @for (i of labelIndexes(); track i) {
              <text
                class="tick"
                [attr.x]="bandX(i) + band() / 2"
                [attr.y]="height - 6"
                text-anchor="middle"
              >
                {{ points()[i].date | date: 'dd/MM' }}
              </text>
            }
            @if (active() !== null) {
              <line
                class="crosshair"
                [attr.x1]="bandX(active()!) + band() / 2"
                [attr.x2]="bandX(active()!) + band() / 2"
                [attr.y1]="pad.top"
                [attr.y2]="pad.top + plotHeight"
              />
            }
          </svg>
          @if (active() !== null) {
            <div
              class="tooltip"
              role="status"
              [style.left.%]="((bandX(active()!) + band() / 2) / width) * 100"
            >
              <strong>{{ format(points()[active()!].value) }}</strong>
              <span>{{ points()[active()!].date | date: 'EEE, dd/MM/yyyy' }}</span>
            </div>
          }
        </div>
        <details class="table-view">
          <summary>Ver tabela</summary>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Dia</th>
                <th scope="col" class="num">{{ valueLabel() }}</th>
              </tr>
            </thead>
            <tbody>
              @for (p of points(); track p.date) {
                <tr>
                  <td>{{ p.date | date: 'dd/MM/yyyy' }}</td>
                  <td class="num">{{ format(p.value) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </details>
      }
    </figure>
  `,
  styleUrl: './charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnChart {
  readonly title = input.required<string>();
  readonly points = input.required<ColumnPoint[]>();
  readonly valueFormat = input<ValueFormat>('integer');
  readonly valueLabel = input('Valor');

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly pad = PAD;
  protected readonly plotHeight = HEIGHT - PAD.top - PAD.bottom;
  protected readonly active = signal<number | null>(null);

  protected readonly ticks = computed(() =>
    niceTicks(Math.max(0, ...this.points().map((p) => p.value))),
  );
  protected readonly band = computed(
    () => (WIDTH - PAD.left - PAD.right) / Math.max(1, this.points().length),
  );
  /** Datas no eixo: ~6 rótulos espaçados, para não se sobreporem. */
  protected readonly labelIndexes = computed(() => {
    const n = this.points().length;
    const step = Math.max(1, Math.ceil(n / 6));
    const out: number[] = [];
    for (let i = 0; i < n; i += step) out.push(i);
    return out;
  });

  protected y(value: number): number {
    const top = this.ticks()[this.ticks().length - 1] || 1;
    return PAD.top + this.plotHeight - (value / top) * this.plotHeight;
  }

  protected bandX(i: number): number {
    return PAD.left + i * this.band();
  }

  /** Coluna até 24px, 2px de folga entre vizinhas, topo arredondado 4px, base recta. */
  protected column(i: number, value: number): string {
    const w = Math.max(1, Math.min(24, this.band() - 2));
    const x = this.bandX(i) + (this.band() - w) / 2;
    const base = PAD.top + this.plotHeight;
    const top = this.y(value);
    const r = Math.min(4, w / 2, base - top);
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`;
  }

  protected onKey(event: KeyboardEvent): void {
    const n = this.points().length;
    const current = this.active();
    if (event.key === 'ArrowRight') {
      this.active.set(current === null ? 0 : Math.min(n - 1, current + 1));
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      this.active.set(current === null ? n - 1 : Math.max(0, current - 1));
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.active.set(null);
    }
  }

  protected tick(value: number): string {
    return formatTick(value, this.valueFormat());
  }

  protected format(value: number): string {
    return formatValue(value, this.valueFormat());
  }
}
