import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Doctor } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import {
  Appointment,
  STATUS_LABELS,
  TYPE_LABELS,
  hhmm,
  isPending,
  isoDate,
} from '../data/scheduling.model';
import { SchedulingService } from '../data/scheduling.service';
import { SlotPicker } from '../slot-picker/slot-picker';

type Panel = 'cancel' | 'reschedule' | null;

/** Detalhe da marcação e acções da recepção: confirmar, chegada, falta, cancelar, remarcar. */
@Component({
  selector: 'app-appointment-detail',
  imports: [FormsModule, RouterLink, DatePipe, SlotPicker],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/scheduling" [queryParams]="{ date: a()?.date }"
            >← Agenda</a
          >
          <h1>Marcação</h1>
          @if (a(); as a) {
            <p class="muted">
              {{ a.date | date: 'EEEE, d MMMM y' }} · {{ hhmm(a.startTime) }}–{{ hhmm(a.endTime) }}
              <span class="badge appt-{{ a.status }}">{{ statuses[a.status] }}</span>
            </p>
          }
        </div>
        @if (a(); as a) {
          @if (canAct() && pending()) {
            <div class="header-actions">
              @if (a.status === 'SCHEDULED') {
                <button
                  class="btn btn-secondary"
                  type="button"
                  [disabled]="busy()"
                  (click)="confirm()"
                >
                  Confirmar
                </button>
              }
              @if (isToday()) {
                <button
                  class="btn btn-primary"
                  type="button"
                  [disabled]="busy()"
                  (click)="checkIn()"
                >
                  Registar chegada
                </button>
              }
              <button class="btn btn-secondary" type="button" (click)="panel.set('reschedule')">
                Remarcar
              </button>
              @if (started()) {
                <button
                  class="btn btn-secondary"
                  type="button"
                  [disabled]="busy()"
                  (click)="noShow()"
                >
                  Faltou
                </button>
              }
              <button class="btn btn-danger" type="button" (click)="panel.set('cancel')">
                Cancelar
              </button>
            </div>
          }
        }
      </header>

      @if (message(); as m) {
        <div class="alert alert-success" role="status">{{ m }}</div>
      }
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }

      @if (a(); as a) {
        @if (panel() === 'cancel') {
          <form class="card" (ngSubmit)="cancel()">
            <label class="field">
              <span>Motivo do cancelamento</span>
              <input name="cancelReason" [(ngModel)]="cancelReason" maxlength="300" required />
            </label>
            <div class="form-actions">
              <button class="btn btn-secondary" type="button" (click)="panel.set(null)">
                Voltar
              </button>
              <button
                class="btn btn-danger"
                type="submit"
                [disabled]="busy() || !cancelReason.trim()"
              >
                Cancelar marcação
              </button>
            </div>
          </form>
        }
        @if (panel() === 'reschedule') {
          <div class="card">
            <h2>Remarcar</h2>
            <div class="grid">
              <label class="field">
                <span>Médico</span>
                <select
                  name="newDoctor"
                  [ngModel]="newDoctor()"
                  (ngModelChange)="newDoctor.set($event)"
                >
                  @for (d of doctors(); track d.id) {
                    <option [value]="d.id">{{ d.fullName }}</option>
                  }
                </select>
              </label>
              <label class="field">
                <span>Data</span>
                <input
                  type="date"
                  name="newDay"
                  [min]="today"
                  [ngModel]="newDay()"
                  (ngModelChange)="newDay.set($event)"
                />
              </label>
              <label class="field span-2">
                <span>Motivo (opcional)</span>
                <input name="rescheduleReason" [(ngModel)]="rescheduleReason" maxlength="200" />
              </label>
            </div>
            <app-slot-picker [doctorId]="newDoctor()" [date]="newDay()" [(selected)]="newSlot" />
            <div class="form-actions">
              <button class="btn btn-secondary" type="button" (click)="panel.set(null)">
                Voltar
              </button>
              <button
                class="btn btn-primary"
                type="button"
                [disabled]="busy() || !newSlot()"
                (click)="reschedule()"
              >
                Remarcar{{ newSlot() ? ' para as ' + hhmm(newSlot()) : '' }}
              </button>
            </div>
          </div>
        }

        <div class="card">
          <dl class="details">
            <dt>Paciente</dt>
            <dd>
              <a [routerLink]="['/patients', a.patientId]">{{ a.patientName }}</a> · processo
              <code>{{ a.patientRecordNumber }}</code>
              {{ a.patientPhone ? '· ' + a.patientPhone : '' }}
            </dd>
            <dt>Médico</dt>
            <dd>{{ a.doctorName }}</dd>
            <dt>Tipo</dt>
            <dd>{{ types[a.type] }}</dd>
            <dt>Motivo</dt>
            <dd>{{ a.reason }}</dd>
            @if (a.notes) {
              <dt>Observações</dt>
              <dd>{{ a.notes }}</dd>
            }
            <dt>Marcada</dt>
            <dd>{{ a.bookedAt | date: 'dd/MM/yyyy HH:mm' }} por {{ a.bookedByName }}</dd>
            @if (a.confirmedAt) {
              <dt>Confirmada</dt>
              <dd>{{ a.confirmedAt | date: 'dd/MM/yyyy HH:mm' }}</dd>
            }
            @if (a.checkedInAt) {
              <dt>Chegada</dt>
              <dd>
                {{ a.checkedInAt | date: 'HH:mm' }}
                @if (a.episodeId) {
                  · <a [routerLink]="['/episodes', a.episodeId]">Abrir episódio</a>
                }
              </dd>
            }
            @if (a.noShowAt) {
              <dt>Falta</dt>
              <dd>Registada às {{ a.noShowAt | date: 'HH:mm' }}</dd>
            }
            @if (a.cancelledAt) {
              <dt>Cancelada</dt>
              <dd>
                {{ a.cancelledAt | date: 'dd/MM/yyyy HH:mm' }} por {{ a.cancelledByName }} —
                {{ a.cancellationReason }}
              </dd>
            }
            @if (a.rescheduledToId) {
              <dt>Nova marcação</dt>
              <dd><a [routerLink]="['/scheduling/appointments', a.rescheduledToId]">Ver</a></dd>
            }
            @if (a.rescheduledFromId) {
              <dt>Remarcada de</dt>
              <dd>
                <a [routerLink]="['/scheduling/appointments', a.rescheduledFromId]"
                  >Marcação anterior</a
                >
              </dd>
            }
          </dl>
        </div>
      } @else if (!error()) {
        <p class="empty" role="status">A carregar…</p>
      }
    </section>
  `,
  styles: `
    .card + .card,
    form.card + .card {
      margin-top: var(--space-4);
    }
    .card {
      margin-bottom: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
    .details {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--space-2) var(--space-4);
      margin: 0;
    }
    dt {
      color: var(--color-muted);
    }
    dd {
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetail implements OnInit {
  private readonly scheduling = inject(SchedulingService);
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly today = isoDate(new Date());
  protected readonly statuses = STATUS_LABELS;
  protected readonly types = TYPE_LABELS;
  protected readonly hhmm = hhmm;
  protected readonly a = signal<Appointment | null>(null);
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly panel = signal<Panel>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly newDoctor = signal<string | null>(null);
  protected readonly newDay = signal<string | null>(null);
  protected readonly newSlot = signal<string | null>(null);
  protected cancelReason = '';
  protected rescheduleReason = '';

  protected readonly canAct = computed(() => this.auth.hasAnyRole(ACCESS.appointmentBook));
  protected readonly pending = computed(() => {
    const a = this.a();
    return !!a && isPending(a.status);
  });
  protected readonly isToday = computed(() => this.a()?.date === this.today);
  /** A falta só se regista depois da hora marcada. */
  protected readonly started = computed(() => {
    const a = this.a();
    if (!a) return false;
    const [y, m, d] = a.date.split('-').map(Number);
    const [h, min] = a.startTime.split(':').map(Number);
    return new Date(y, m - 1, d, h, min) <= new Date();
  });

  constructor() {
    // A remarcação navega para a nova marcação no mesmo componente: recarrega quando o id muda.
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  ngOnInit(): void {
    this.episodes.doctors().subscribe({
      next: (list) => this.doctors.set(list),
      error: () => this.doctors.set([]),
    });
  }

  protected confirm(): void {
    this.act(this.scheduling.confirm(this.id()), 'Marcação confirmada.');
  }

  protected checkIn(): void {
    this.act(
      this.scheduling.checkIn(this.id()),
      'Chegada registada: o episódio foi aberto e está na lista de trabalho.',
    );
  }

  protected noShow(): void {
    this.act(this.scheduling.noShow(this.id()), 'Falta registada.');
  }

  protected cancel(): void {
    this.act(this.scheduling.cancel(this.id(), this.cancelReason.trim()), 'Marcação cancelada.');
  }

  protected reschedule(): void {
    const day = this.newDay();
    const slot = this.newSlot();
    if (!day || !slot) return;
    this.busy.set(true);
    this.error.set(null);
    this.scheduling
      .reschedule(this.id(), {
        doctorId: this.newDoctor(),
        date: day,
        startTime: slot,
        reason: this.rescheduleReason.trim() || null,
      })
      .subscribe({
        next: (created) => {
          this.busy.set(false);
          this.panel.set(null);
          void this.router.navigate(['/scheduling/appointments', created.id]);
        },
        error: (err: unknown) => this.fail(err),
      });
  }

  private act(request: Observable<Appointment>, success: string): void {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    request.subscribe({
      next: (a) => {
        this.busy.set(false);
        this.panel.set(null);
        this.a.set(a);
        this.message.set(success);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(toApiError(err).message);
  }

  private load(id: string): void {
    this.a.set(null);
    this.message.set(null);
    this.panel.set(null);
    this.scheduling.appointment(id).subscribe({
      next: (a) => {
        this.a.set(a);
        this.newDoctor.set(a.doctorId);
        this.newDay.set(a.date >= this.today ? a.date : this.today);
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
