import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { GENDER_POLICY_LABELS, WARD_TYPE_LABELS, Ward, occupancy } from '../data/inpatient.model';
import { InpatientService } from '../data/inpatient.service';

/** Visão geral: ocupação de cada enfermaria; um clique abre o mapa de camas. */
@Component({
  selector: 'app-ward-board',
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Internamento</h1>
          @if (totals(); as t) {
            <p class="muted">
              {{ t.occupied }} de {{ t.beds }} camas ocupadas · {{ t.available }} livre(s) ·
              {{ t.cleaning }} em limpeza
            </p>
          }
        </div>
        <div class="header-actions">
          <a class="btn btn-secondary" routerLink="admissions">Internamentos</a>
          @if (canManage()) {
            <a class="btn btn-secondary" routerLink="manage">Gerir enfermarias</a>
          }
          @if (canAdmit()) {
            <a class="btn btn-primary" routerLink="admit">Internar</a>
          }
        </div>
      </header>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      @if (wards(); as list) {
        @if (list.length === 0) {
          <p class="card empty">
            Ainda não há enfermarias.
            @if (canManage()) {
              <a routerLink="manage">Criar a primeira</a>.
            }
          </p>
        } @else {
          <div class="wards">
            @for (w of list; track w.id) {
              <a class="card ward" [routerLink]="['wards', w.id]">
                <span class="name"
                  >{{ w.name }} <code>{{ w.code }}</code></span
                >
                <span class="muted"
                  >{{ types[w.type] }} · {{ genders[w.genderPolicy]
                  }}{{ w.floor ? ' · piso ' + w.floor : '' }}</span
                >
                <span
                  class="bar"
                  role="progressbar"
                  [attr.aria-valuenow]="occupancy(w)"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  [attr.aria-label]="'Ocupação ' + occupancy(w) + '%'"
                >
                  <span [style.width.%]="occupancy(w)" [class.full]="w.available === 0"></span>
                </span>
                <span class="counts">
                  <strong>{{ w.occupied }}/{{ w.beds }}</strong> ocupadas ·
                  <span class="free">{{ w.available }} livre(s)</span>
                  @if (w.cleaning) {
                    · {{ w.cleaning }} em limpeza
                  }
                  @if (w.maintenance) {
                    · {{ w.maintenance }} manutenção
                  }
                </span>
              </a>
            }
          </div>
        }
      } @else if (!error()) {
        <p class="empty" role="status">A carregar…</p>
      }
    </section>
  `,
  styles: `
    .wards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: var(--space-4);
    }
    .ward {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      color: var(--color-text);
      text-decoration: none;
    }
    .ward:hover,
    .ward:focus-visible {
      border-color: var(--color-primary);
    }
    .name {
      font-weight: 700;
      font-size: 1.05rem;
    }
    .bar {
      display: block;
      height: 0.5rem;
      border-radius: 999px;
      background: var(--color-bg);
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--color-primary);
    }
    .bar span.full {
      background: var(--color-danger);
    }
    .counts {
      font-size: 0.875rem;
    }
    .free {
      color: var(--color-success);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WardBoard implements OnInit {
  private readonly inpatient = inject(InpatientService);
  private readonly auth = inject(AuthService);

  protected readonly types = WARD_TYPE_LABELS;
  protected readonly genders = GENDER_POLICY_LABELS;
  protected readonly occupancy = occupancy;
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.wardManage));
  protected readonly canAdmit = computed(() => this.auth.hasAnyRole(ACCESS.admit));
  protected readonly wards = signal<Ward[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly totals = computed(() => {
    const list = this.wards();
    if (!list?.length) return null;
    return list.reduce(
      (t, w) => ({
        beds: t.beds + w.beds,
        occupied: t.occupied + w.occupied,
        available: t.available + w.available,
        cleaning: t.cleaning + w.cleaning,
      }),
      { beds: 0, occupied: 0, available: 0, cleaning: 0 },
    );
  });

  ngOnInit(): void {
    this.inpatient.wards().subscribe({
      next: (list) => this.wards.set(list),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
