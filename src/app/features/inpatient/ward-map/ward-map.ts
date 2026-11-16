import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import {
  BED_STATUS_LABELS,
  BED_TYPE_LABELS,
  Bed,
  BedStatus,
  GENDER_POLICY_LABELS,
  WardMap as WardMapData,
} from '../data/inpatient.model';
import { InpatientService } from '../data/inpatient.service';

/** Mapa de camas: estado, doente e acções rápidas (internar, limpeza, abrir internamento). */
@Component({
  selector: 'app-ward-map',
  imports: [RouterLink, DatePipe],
  template: `
    <section class="page">
      <a class="btn-link back" routerLink="/inpatient">← Enfermarias</a>
      @if (map(); as m) {
        <header class="page-header">
          <div>
            <h1>{{ m.ward.name }}</h1>
            <p class="muted">
              {{ genders[m.ward.genderPolicy] }} · {{ m.ward.occupied }}/{{ m.ward.beds }} ocupadas
              · {{ m.ward.available }} livre(s)
            </p>
          </div>
        </header>
        @if (error(); as message) {
          <div class="alert alert-error" role="alert">{{ message }}</div>
        }
        <ul class="beds">
          @for (b of m.beds; track b.id) {
            <li class="bed bed-{{ b.status }}">
              <div class="head">
                <strong>Cama {{ b.code }}</strong>
                <span class="badge bed-{{ b.status }}">{{ statuses[b.status] }}</span>
              </div>
              @if (b.type !== 'STANDARD') {
                <small class="muted">{{ bedTypes[b.type] }}</small>
              }
              @if (b.occupant; as o) {
                <a class="occupant" [routerLink]="['/inpatient/admissions', o.admissionId]">
                  {{ o.patientName }}
                </a>
                <small class="muted">
                  {{ o.age ?? '?' }} anos · processo {{ o.patientRecordNumber }}<br />
                  Desde {{ o.admittedAt | date: 'dd/MM' }} · {{ o.responsibleDoctorName }}
                  @if (o.expectedDischargeDate) {
                    <br />Alta prevista {{ o.expectedDischargeDate | date: 'dd/MM' }}
                  }
                </small>
              } @else {
                @if (b.statusNote) {
                  <small class="muted">{{ b.statusNote }}</small>
                }
                <div class="actions">
                  @if (b.status === 'AVAILABLE' && canAdmit()) {
                    <a
                      class="btn btn-small btn-primary"
                      routerLink="/inpatient/admit"
                      [queryParams]="{ wardId: m.ward.id, bedId: b.id }"
                      >Internar</a
                    >
                  }
                  @if (canKeep()) {
                    @if (b.status !== 'AVAILABLE') {
                      <button
                        class="btn btn-small btn-secondary"
                        type="button"
                        [disabled]="busy()"
                        (click)="setStatus(b, 'AVAILABLE')"
                      >
                        {{ b.status === 'CLEANING' ? 'Limpa' : 'Disponível' }}
                      </button>
                    }
                    @if (b.status !== 'MAINTENANCE') {
                      <button
                        class="btn btn-small btn-secondary"
                        type="button"
                        [disabled]="busy()"
                        (click)="setStatus(b, 'MAINTENANCE')"
                      >
                        Manutenção
                      </button>
                    }
                  }
                </div>
              }
            </li>
          } @empty {
            <li class="card empty">Esta enfermaria ainda não tem camas.</li>
          }
        </ul>
      } @else if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      } @else {
        <p class="empty" role="status">A carregar…</p>
      }
    </section>
  `,
  styles: `
    .beds {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
      gap: var(--space-3);
    }
    .bed {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-left-width: 6px;
      border-radius: var(--radius);
      background: var(--color-surface);
    }
    .bed-AVAILABLE {
      border-left-color: var(--color-success);
    }
    .bed-OCCUPIED {
      border-left-color: var(--color-primary);
    }
    .bed-CLEANING {
      border-left-color: var(--color-warning);
    }
    .bed-MAINTENANCE {
      border-left-color: var(--color-muted);
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .occupant {
      font-weight: 600;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WardMap implements OnInit {
  private readonly inpatient = inject(InpatientService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly statuses = BED_STATUS_LABELS;
  protected readonly bedTypes = BED_TYPE_LABELS;
  protected readonly genders = GENDER_POLICY_LABELS;
  protected readonly canAdmit = computed(() => this.auth.hasAnyRole(ACCESS.admit));
  protected readonly canKeep = computed(() => this.auth.hasAnyRole(ACCESS.bedKeep));
  protected readonly map = signal<WardMapData | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected setStatus(b: Bed, status: BedStatus): void {
    this.busy.set(true);
    this.error.set(null);
    this.inpatient.setBedStatus(b.id, status).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }

  private load(): void {
    this.inpatient.map(this.id()).subscribe({
      next: (m) => this.map.set(m),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
