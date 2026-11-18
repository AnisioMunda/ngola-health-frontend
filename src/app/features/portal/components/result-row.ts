import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { FLAG_LABELS, PortalResult } from '../data/portal.model';

/** Uma linha de resultado: exame, valor, referência e (se for o caso) aviso de alterado. */
@Component({
  selector: 'app-result-row',
  template: `
    @let r = result();
    <span class="test">{{ r.testName }}</span>
    <span class="value" [class.abnormal]="abnormal()">
      {{ r.value }} {{ r.unit ?? '' }}
      @if (abnormal()) {
        <span class="badge badge-warning">{{ flags[r.flag!] }}</span>
      }
    </span>
    <span class="ref muted">{{ r.reference ? 'Ref.: ' + r.reference : '' }}</span>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: minmax(8rem, 1fr) minmax(8rem, 1fr) minmax(6rem, auto);
      gap: var(--space-2);
      padding: var(--space-2) 0;
      border-top: 1px solid var(--color-border);
    }
    .test {
      font-weight: 600;
    }
    .value.abnormal {
      font-weight: 700;
    }
    @media (max-width: 480px) {
      :host {
        grid-template-columns: 1fr;
        gap: 0.15rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultRow {
  readonly result = input.required<PortalResult>();
  protected readonly flags = FLAG_LABELS;

  protected abnormal(): boolean {
    const f = this.result().flag;
    return !!f && f !== 'NORMAL';
  }
}
