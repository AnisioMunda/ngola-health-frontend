import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { toApiError } from '../../../core/http/api-error';
import { PRESCRIPTION_STATUS, PortalPrescription } from '../data/portal.model';
import { PortalService } from '../data/portal.service';

/** As minhas receitas: o que foi receitado, como tomar e o que falta levantar. */
@Component({
  selector: 'app-portal-prescriptions',
  imports: [DatePipe],
  template: `
    <section class="page narrow">
      <h1>As minhas receitas</h1>
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      @for (p of prescriptions(); track p.id) {
        <article class="card">
          <h2>
            {{ p.prescribedAt | date: 'd MMMM y' }}
            <span class="badge rx-{{ p.status }}">{{ statuses[p.status] ?? p.status }}</span>
          </h2>
          <p class="muted">
            {{ p.number }} · {{ p.doctorName }} · válida até {{ p.validUntil | date: 'dd/MM/yyyy' }}
          </p>
          <ul>
            @for (i of p.items; track i.medication) {
              <li>
                <strong>{{ i.medication }}</strong> — {{ i.dosage }}
                @if (i.status === 'DISPENSED') {
                  <span class="muted">(levantado)</span>
                }
              </li>
            }
          </ul>
        </article>
      } @empty {
        <p class="muted">Sem receitas.</p>
      }
    </section>
  `,
  styles: `
    .card {
      margin-bottom: var(--space-3);
    }
    h2 {
      font-size: 1rem;
      margin: 0;
    }
    ul {
      margin: var(--space-2) 0 0;
      padding-left: var(--space-4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalPrescriptions implements OnInit {
  private readonly portal = inject(PortalService);
  protected readonly statuses = PRESCRIPTION_STATUS;
  protected readonly prescriptions = signal<PortalPrescription[]>([]);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.portal.prescriptions().subscribe({
      next: (p) => this.prescriptions.set(p),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
