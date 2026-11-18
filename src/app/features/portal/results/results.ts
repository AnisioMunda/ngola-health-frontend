import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { toApiError } from '../../../core/http/api-error';
import { ResultRow } from '../components/result-row';
import { PortalLabRequest } from '../data/portal.model';
import { PortalService } from '../data/portal.service';

/** Resultados validados pelo laboratório (os outros aparecem como "por concluir"). */
@Component({
  selector: 'app-portal-results',
  imports: [DatePipe, ResultRow],
  template: `
    <section class="page narrow">
      <h1>Os meus resultados</h1>
      <p class="muted">
        Só aparecem resultados já validados pelo laboratório. Fale com o seu médico sobre o que
        significam para si.
      </p>
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      @for (r of requests(); track r.id) {
        <article class="card">
          <h2>
            {{ r.requestedAt | date: 'd MMMM y' }}
            <small class="muted">· {{ r.number }} · {{ r.requestedByName }}</small>
          </h2>
          @for (res of r.results; track res.testName) {
            <app-result-row [result]="res" />
          }
          @if (r.pending > 0) {
            <p class="muted">{{ r.pending }} exame(s) ainda por concluir.</p>
          }
        </article>
      } @empty {
        <p class="muted">Sem resultados.</p>
      }
    </section>
  `,
  styles: `
    .card {
      margin-bottom: var(--space-3);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalResults implements OnInit {
  private readonly portal = inject(PortalService);
  protected readonly requests = signal<PortalLabRequest[]>([]);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.portal.labResults().subscribe({
      next: (r) => this.requests.set(r),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
