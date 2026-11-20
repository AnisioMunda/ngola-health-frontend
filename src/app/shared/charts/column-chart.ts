import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { ChartViewToggle } from './chart-view-toggle';
import { ValueFormat, formatTick, formatValue, niceTicks } from './chart-format';

export interface ColumnPoint {
  /** Data ISO (yyyy-MM-dd). */
  date: string;
  value: number;
}

/** Largura inicial (antes de medir o ecrã); depois o SVG usa a largura real, 1 unidade = 1 px. */
const DEFAULT_WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 14, right: 8, bottom: 26, left: 36 };
/** Coluna mais larga possível: colunas finas lêem-se melhor do que blocos. */
const MAX_COLUMN = 18;

/**
 * Colunas diárias de uma só série (evolução no tempo). Cada coluna tem a faixa inteira como zona
 * de toque; setas ←/→ percorrem os dias com o teclado. O SVG acompanha a largura do cartão, por
 * isso o texto dos eixos mantém sempre o mesmo tamanho. Alterna com a vista em tabela.
 */
@Component({
  selector: 'app-column-chart',
  imports: [DatePipe, ChartViewToggle],
  template: `
    <figure class="chart column-chart">
      <header class="chart-header">
        <div class="chart-heading">
          <figcaption class="chart-title">{{ title() }}</figcaption>
          @if (subtitle()) {
            <p class="chart-subtitle">{{ subtitle() }}</p>
          }
        </div>
        @if (points().length > 0) {
          <app-chart-view-toggle [(view)]="view" />
        }
      </header>
      @if (points().length === 0) {
        <p class="chart-empty">Sem dados no período.</p>
      } @else {
        <div class="plot" [hidden]="view() === 'table'">
          <svg
            [attr.viewBox]="'0 0 ' + width() + ' ' + height"
            [attr.height]="height"
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
                [attr.x2]="width() - pad.right"
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
            <div class="tooltip" role="status" [style.left.px]="bandX(active()!) + band() / 2">
              <strong>{{ format(points()[active()!].value) }}</strong>
              <span>{{ points()[active()!].date | date: 'EEE, dd/MM/yyyy' }}</span>
            </div>
          }
        </div>
        <div class="table-view table-view--scroll" [hidden]="view() === 'chart'">
          <table class="table table--compact">
            <caption class="visually-hidden">
              {{
                title()
              }}
            </caption>
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
        </div>
      }
    </figure>
  `,
  styleUrl: './charts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnChart {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly points = input.required<ColumnPoint[]>();
  readonly valueFormat = input<ValueFormat>('integer');
  readonly valueLabel = input('Valor');

  protected readonly width = signal(DEFAULT_WIDTH);
  protected readonly height = HEIGHT;
  protected readonly view = signal<'chart' | 'table'>('chart');
  protected readonly pad = PAD;
  protected readonly plotHeight = HEIGHT - PAD.top - PAD.bottom;
  protected readonly active = signal<number | null>(null);

  protected readonly ticks = computed(() =>
    niceTicks(Math.max(0, ...this.points().map((p) => p.value))),
  );
  protected readonly band = computed(
    () => (this.width() - PAD.left - PAD.right) / Math.max(1, this.points().length),
  );
  /** Datas no eixo: uma a cada ~90 px, para não se sobreporem. */
  protected readonly labelIndexes = computed(() => {
    const n = this.points().length;
    const fit = Math.max(2, Math.floor((this.width() - PAD.left - PAD.right) / 90));
    const step = Math.max(1, Math.ceil(n / fit));
    const out: number[] = [];
    for (let i = 0; i < n; i += step) out.push(i);
    return out;
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    // Mede o cartão e acompanha as mudanças de tamanho (janela, menu lateral, telemóvel).
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) => {
        const w = Math.round(entry.contentRect.width);
        if (w > 0 && w !== this.width()) this.width.set(w);
      });
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected y(value: number): number {
    const top = this.ticks()[this.ticks().length - 1] || 1;
    return PAD.top + this.plotHeight - (value / top) * this.plotHeight;
  }

  protected bandX(i: number): number {
    return PAD.left + i * this.band();
  }

  /** Coluna até 18 px, folga entre vizinhas, topo arredondado 4 px, base recta. */
  protected column(i: number, value: number): string {
    const w = Math.max(1, Math.min(MAX_COLUMN, this.band() * 0.62));
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
