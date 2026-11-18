import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ValueFormat, formatValue } from './chart-format';

export interface BarItem {
  label: string;
  value: number;
  /** Cor própria (ex.: prioridade de Manchester); por omissão, a cor da série. */
  color?: string;
}

/**
 * Barras horizontais de uma só série (comparar categorias). O valor fica na ponta, em texto
 * normal; a identidade vem sempre do rótulo escrito, nunca só da cor. Inclui a vista em tabela.
 */
@Component({
  selector: 'app-bar-list',
  template: `
    <figure class="bar-list" [attr.aria-label]="title()">
      <figcaption class="chart-title">{{ title() }}</figcaption>
      @if (items().length === 0) {
        <p class="muted">Sem dados no período.</p>
      } @else {
        <ul>
          @for (item of items(); track item.label) {
            <li
              tabindex="0"
              [attr.aria-label]="item.label + ': ' + format(item.value)"
              [title]="item.label + ': ' + format(item.value)"
            >
              <span class="label">{{ item.label }}</span>
              <span class="track">
                <span
                  class="bar"
                  [style.width.%]="width(item.value)"
                  [style.background]="item.color ?? 'var(--chart-series-1)'"
                ></span>
                <span class="value">{{ format(item.value) }}</span>
              </span>
            </li>
          }
        </ul>
        <details class="table-view">
          <summary>Ver tabela</summary>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">{{ categoryLabel() }}</th>
                <th scope="col" class="num">{{ valueLabel() }}</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.label) {
                <tr>
                  <td>{{ item.label }}</td>
                  <td class="num">{{ format(item.value) }}</td>
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
export class BarList {
  readonly title = input.required<string>();
  readonly items = input.required<BarItem[]>();
  readonly valueFormat = input<ValueFormat>('integer');
  readonly categoryLabel = input('Categoria');
  readonly valueLabel = input('Valor');

  private readonly max = computed(() => Math.max(0, ...this.items().map((i) => i.value)));

  protected width(value: number): number {
    const max = this.max();
    return max === 0 ? 0 : (value / max) * 100;
  }

  protected format(value: number): string {
    return formatValue(value, this.valueFormat());
  }
}
