import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { ChartViewToggle } from './chart-view-toggle';
import { ValueFormat, formatValue } from './chart-format';

export interface BarItem {
  label: string;
  value: number;
  /** Cor própria (ex.: prioridade de Manchester); por omissão, a cor da série. */
  color?: string;
}

/**
 * Barras horizontais de uma só série (comparar categorias). Rótulo e valor ficam escritos por
 * cima da barra; a identidade vem sempre do texto, nunca só da cor. Alterna com a vista em tabela.
 */
@Component({
  selector: 'app-bar-list',
  imports: [ChartViewToggle],
  template: `
    <figure class="chart" [attr.aria-label]="title()">
      <header class="chart-header">
        <div class="chart-heading">
          <figcaption class="chart-title">{{ title() }}</figcaption>
          @if (subtitle()) {
            <p class="chart-subtitle">{{ subtitle() }}</p>
          }
        </div>
        @if (items().length > 0) {
          <app-chart-view-toggle [(view)]="view" />
        }
      </header>

      @if (items().length === 0) {
        <p class="chart-empty">Sem dados no período.</p>
      } @else {
        <ul class="bars" [hidden]="view() === 'table'">
          @for (item of items(); track item.label) {
            <li
              tabindex="0"
              [attr.aria-label]="item.label + ': ' + format(item.value)"
              [title]="item.label + ': ' + format(item.value)"
            >
              <span class="bar-row">
                <span class="label">{{ item.label }}</span>
                <span class="value">{{ format(item.value) }}</span>
              </span>
              <span class="track">
                <span
                  class="bar"
                  [style.width.%]="width(item.value)"
                  [style.background]="item.color ?? 'var(--chart-series-1)'"
                ></span>
              </span>
            </li>
          }
        </ul>

        <div class="table-view" [hidden]="view() === 'chart'">
          <table class="table table--compact">
            <caption class="visually-hidden">
              {{
                title()
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ categoryLabel() }}</th>
                <th scope="col" class="num">{{ valueLabel() }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.label) {
                <tr>
                  <td>
                    <span class="cell-label">
                      @if (item.color) {
                        <span class="dot" [style.background]="item.color" aria-hidden="true"></span>
                      }
                      {{ item.label }}
                    </span>
                  </td>
                  <td class="num">{{ format(item.value) }}</td>
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
export class BarList {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly items = input.required<BarItem[]>();
  readonly valueFormat = input<ValueFormat>('integer');
  readonly categoryLabel = input('Categoria');
  readonly valueLabel = input('Valor');

  protected readonly view = signal<'chart' | 'table'>('chart');

  private readonly max = computed(() => Math.max(0, ...this.items().map((i) => i.value)));

  protected width(value: number): number {
    const max = this.max();
    return max === 0 ? 0 : (value / max) * 100;
  }

  protected format(value: number): string {
    return formatValue(value, this.valueFormat());
  }
}
