import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatTone = 'teal' | 'blue' | 'amber' | 'violet' | 'rose';

/**
 * Cartão de indicador: ícone e rótulo, valor em destaque e um rodapé com os detalhes. Usa o
 * estilo de cartão da aplicação (.card, tokens --card-*). O ícone entra por projecção:
 *
 * <app-stat-card label="Episódios" value="110" [meta]="['102 concluídos']" tone="teal">
 *   <svg icon viewBox="0 0 24 24">…</svg>
 * </app-stat-card>
 */
@Component({
  selector: 'app-stat-card',
  host: {
    class: 'card card--interactive stat-card',
    '[attr.data-tone]': 'tone()',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <div class="head">
      <span class="icon" aria-hidden="true"><ng-content select="[icon]" /></span>
      <span class="label">{{ label() }}</span>
    </div>

    <p class="value">
      <span>{{ value() }}</span>
      @if (valueNote(); as note) {
        <span class="value-note">{{ note }}</span>
      }
    </p>

    @if (progress() !== null && progress() !== undefined) {
      <span
        class="progress"
        role="progressbar"
        [attr.aria-valuenow]="progress()"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="label()"
      >
        <span [style.width.%]="clampedProgress()"></span>
      </span>
    }

    @if (meta().length > 0) {
      <ul class="meta">
        @for (item of meta(); track $index) {
          <li>{{ item }}</li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 0.55rem;
      color: var(--card-text);

      --tone: var(--card-accent);
      --tone-soft: #e7f5f1;
    }

    :host([data-tone='blue']) {
      --tone: #3574bd;
      --tone-soft: #eaf2fc;
    }

    :host([data-tone='amber']) {
      --tone: #bd7b14;
      --tone-soft: #fff4df;
    }

    :host([data-tone='violet']) {
      --tone: #7862bb;
      --tone-soft: #f0edfb;
    }

    :host([data-tone='rose']) {
      --tone: #c2475a;
      --tone-soft: #fdecef;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-width: 0;
    }

    .icon {
      display: grid;
      width: 2.2rem;
      height: 2.2rem;
      flex: 0 0 auto;
      place-items: center;
      color: var(--tone);
      background: var(--tone-soft);
      border-radius: 0.7rem;

      ::ng-deep svg {
        width: 1.15rem;
        height: 1.15rem;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.6;
      }
    }

    .label {
      min-width: 0;
      color: var(--card-muted);
      font-size: 0.76rem;
      font-weight: 600;
      line-height: 1.3;
    }

    /* O número fica centrado no cartão. */
    .value {
      display: flex;
      align-items: baseline;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.35rem;
      text-align: center;
      margin: 0.15rem 0 0;
      color: var(--card-text);
      font-size: clamp(1.45rem, 2.1vw, 1.85rem);
      font-variant-numeric: tabular-nums;
      font-weight: 750;
      letter-spacing: -0.04em;
      line-height: 1.1;
    }

    .value-note {
      color: var(--card-subtle);
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .progress {
      display: block;
      height: 0.35rem;
      overflow: hidden;
      background: #eef3f2;
      border-radius: 99px;

      span {
        display: block;
        height: 100%;
        background: var(--tone);
        border-radius: inherit;
        transition: width 350ms ease;
      }
    }

    /* Detalhes: cada item quebra de linha inteiro, separados por um ponto. */
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.2rem 0.5rem;
      margin: auto 0 0;
      padding: 0.6rem 0 0;
      list-style: none;
      border-top: 1px solid #f0f4f3;
      color: var(--card-muted);
      font-size: 0.72rem;
      line-height: 1.4;
      font-variant-numeric: tabular-nums;

      li {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
      }

      li + li::before {
        width: 0.2rem;
        height: 0.2rem;
        content: '';
        background: #c3cdcb;
        border-radius: 50%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  /** Texto pequeno a seguir ao valor (ex.: "/ 10 altas"). */
  readonly valueNote = input<string>();
  /** Detalhes no rodapé; cada um é mostrado inteiro. */
  readonly meta = input<string[]>([]);
  readonly tone = input<StatTone>('teal');
  /** Percentagem (0–100) para a barra de progresso; null não mostra a barra. */
  readonly progress = input<number | null>(null);

  protected readonly clampedProgress = computed(() =>
    Math.max(0, Math.min(100, this.progress() ?? 0)),
  );
  protected readonly ariaLabel = computed(() =>
    [this.label(), this.value(), this.valueNote(), ...this.meta()].filter(Boolean).join(', '),
  );
}
