import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { InpatientService } from '../data/inpatient.service';

/** /inpatient/episode/:episodeId → abre o internamento desse episódio. */
@Component({
  selector: 'app-admission-by-episode',
  imports: [RouterLink],
  template: `
    @if (error(); as message) {
      <section class="page">
        <div class="alert alert-error" role="alert">{{ message }}</div>
        <a class="btn-link" [routerLink]="['/episodes', episodeId()]">← Voltar ao episódio</a>
      </section>
    } @else {
      <p class="empty" role="status">A abrir internamento…</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionByEpisode implements OnInit {
  private readonly inpatient = inject(InpatientService);
  private readonly router = inject(Router);

  readonly episodeId = input.required<string>();
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.inpatient.byEpisode(this.episodeId()).subscribe({
      next: (a) => void this.router.navigate(['/inpatient/admissions', a.id], { replaceUrl: true }),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
