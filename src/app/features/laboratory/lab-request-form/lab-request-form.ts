import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { Episode } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import {
  CATEGORY_LABELS,
  LabPriority,
  LabTest,
  SAMPLE_LABELS,
  TestCategory,
} from '../data/lab.model';
import { LabService } from '../data/lab.service';

/** Pedir exames num episódio em curso (/lab/requests/new?episodeId=…). */
@Component({
  selector: 'app-lab-request-form',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" [routerLink]="['/episodes', episodeId()]">← Episódio</a>
          <h1>Pedir exames</h1>
          @if (episode(); as e) {
            <p class="muted">
              {{ e.patientName }} · processo <code>{{ e.patientRecordNumber }}</code> ·
              {{ e.reason }}
            </p>
          }
        </div>
      </header>

      <div class="card">
        <label class="field"
          ><span>Filtrar exames</span
          ><input [(ngModel)]="filter" name="filter" placeholder="Nome ou código"
        /></label>
        @for (group of groups(); track group.category) {
          <fieldset class="group">
            <legend>{{ categories[group.category] }}</legend>
            @for (t of group.tests; track t.id) {
              <label class="check-inline">
                <input type="checkbox" [checked]="selected().has(t.id)" (change)="toggle(t.id)" />
                {{ t.name }} <span class="muted">({{ t.code }} · {{ samples[t.sampleType] }})</span>
              </label>
            }
          </fieldset>
        } @empty {
          <p class="muted">
            Nenhum exame activo no catálogo{{ filter ? ' com esse filtro' : '' }}.
          </p>
        }
      </div>

      <div class="card">
        <div class="grid">
          <label class="field">
            <span>Prioridade</span>
            <select [(ngModel)]="priority" name="priority">
              <option value="ROUTINE">Normal</option>
              <option value="URGENT">Urgente</option>
            </select>
          </label>
          <label class="field span-2">
            <span>Informação clínica</span>
            <textarea
              [(ngModel)]="clinicalInfo"
              name="clinicalInfo"
              rows="2"
              maxlength="4000"
              placeholder="Hipótese diagnóstica, medicação relevante…"
            ></textarea>
          </label>
        </div>
      </div>

      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="form-actions">
        <a class="btn btn-secondary" [routerLink]="['/episodes', episodeId()]">Cancelar</a>
        <button
          class="btn btn-primary"
          type="button"
          [disabled]="saving() || episode()?.status !== 'IN_PROGRESS'"
          (click)="submit()"
        >
          {{ saving() ? 'A pedir…' : 'Pedir ' + selected().size + ' exame(s)' }}
        </button>
      </div>
    </section>
  `,
  styles: `
    .card + .card {
      margin-top: var(--space-4);
    }
    .group {
      margin: var(--space-3) 0 0;
      border: 0;
      padding: 0;
      display: grid;
      gap: var(--space-1);
    }
    .group legend {
      font-weight: 600;
      margin-bottom: var(--space-1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabRequestForm implements OnInit {
  private readonly lab = inject(LabService);
  private readonly episodes = inject(EpisodeService);
  private readonly router = inject(Router);

  readonly episodeId = input.required<string>();

  protected readonly categories = CATEGORY_LABELS;
  protected readonly samples = SAMPLE_LABELS;
  protected readonly episode = signal<Episode | null>(null);
  protected readonly tests = signal<LabTest[]>([]);
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly filterText = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected priority: LabPriority = 'ROUTINE';
  protected clinicalInfo = '';

  protected get filter(): string {
    return this.filterText();
  }
  protected set filter(value: string) {
    this.filterText.set(value);
  }

  protected readonly groups = computed(() => {
    const term = this.filterText().trim().toLowerCase();
    const visible = this.tests().filter(
      (t) => !term || t.name.toLowerCase().includes(term) || t.code.toLowerCase().includes(term),
    );
    const byCategory = new Map<TestCategory, LabTest[]>();
    for (const t of visible) byCategory.set(t.category, [...(byCategory.get(t.category) ?? []), t]);
    return [...byCategory.entries()].map(([category, tests]) => ({ category, tests }));
  });

  ngOnInit(): void {
    this.episodes.view(this.episodeId()).subscribe({
      next: (e) => {
        this.episode.set(e);
        if (e.status !== 'IN_PROGRESS') this.error.set('Só se pedem exames num episódio em curso.');
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
    this.lab.tests({ active: true }).subscribe({ next: (list) => this.tests.set(list) });
  }

  protected toggle(id: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  submit(): void {
    if (this.saving()) return;
    if (this.selected().size === 0) {
      this.error.set('Seleccione pelo menos um exame.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.lab
      .create({
        episodeId: this.episodeId(),
        priority: this.priority,
        clinicalInfo: this.clinicalInfo.trim() || null,
        testIds: [...this.selected()],
      })
      .subscribe({
        next: (r) => void this.router.navigate(['/lab/requests', r.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(toApiError(err).message);
        },
      });
  }
}
