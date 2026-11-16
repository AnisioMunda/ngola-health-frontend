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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Doctor } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import {
  Appointment,
  STATUS_LABELS,
  TYPE_LABELS,
  addDays,
  hhmm,
  isoDate,
} from '../data/scheduling.model';
import { SchedulingService } from '../data/scheduling.service';

/** Agenda de um dia (/scheduling?date=…&doctorId=…). Um médico vê por omissão a sua. */
@Component({
  selector: 'app-agenda-day',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Agenda</h1>
          <p class="muted">Marcações do dia por hora.</p>
        </div>
        <div class="header-actions">
          <a
            class="btn btn-secondary"
            routerLink="calendar"
            [queryParams]="{ doctorId: doctor || null }"
            >Calendário</a
          >
          <a class="btn btn-secondary" routerLink="schedules">Horários e ausências</a>
          @if (canBook()) {
            <a
              class="btn btn-primary"
              routerLink="new"
              [queryParams]="{ date: day(), doctorId: doctor || null }"
              >Nova marcação</a
            >
          }
        </div>
      </header>

      <div class="filters card">
        <button
          class="btn btn-secondary btn-small"
          type="button"
          (click)="shift(-1)"
          aria-label="Dia anterior"
        >
          ←
        </button>
        <label class="field"
          ><span>Dia</span
          ><input type="date" name="day" [ngModel]="day()" (ngModelChange)="go($event, doctor)"
        /></label>
        <button
          class="btn btn-secondary btn-small"
          type="button"
          (click)="shift(1)"
          aria-label="Dia seguinte"
        >
          →
        </button>
        <button class="btn btn-secondary btn-small" type="button" (click)="go(today, doctor)">
          Hoje
        </button>
        <label class="field"
          ><span>Médico</span>
          <select name="doctor" [ngModel]="doctor" (ngModelChange)="go(day(), $event)">
            <option value="">Todos</option>
            @for (d of doctors(); track d.id) {
              <option [value]="d.id">{{ d.fullName }}</option>
            }
          </select>
        </label>
        <label class="check-inline">
          <input
            type="checkbox"
            name="hideClosed"
            [ngModel]="hideClosed()"
            (ngModelChange)="hideClosed.set($event)"
          />
          Esconder canceladas e faltas
        </label>
      </div>

      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="card table-card">
        @if (appointments(); as list) {
          @if (visible().length === 0) {
            <p class="empty">Sem marcações neste dia.</p>
          } @else {
            <div class="table-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Hora</th>
                    <th scope="col">Paciente</th>
                    <th scope="col">Médico</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span class="visually-hidden">Acções</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of visible(); track a.id) {
                    <tr>
                      <td>
                        <strong>{{ hhmm(a.startTime) }}</strong
                        ><span class="subtext">até {{ hhmm(a.endTime) }}</span>
                      </td>
                      <td>
                        {{ a.patientName
                        }}<span class="subtext"
                          >Processo {{ a.patientRecordNumber
                          }}{{ a.patientPhone ? ' · ' + a.patientPhone : '' }}</span
                        >
                      </td>
                      <td>{{ a.doctorName }}</td>
                      <td>{{ types[a.type] }}</td>
                      <td>
                        <span class="badge appt-{{ a.status }}">{{ statuses[a.status] }}</span>
                      </td>
                      <td class="actions">
                        <a class="btn btn-small btn-secondary" [routerLink]="['appointments', a.id]"
                          >Abrir</a
                        >
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="muted total">{{ summary() }}</p>
          }
        } @else if (!error()) {
          <p class="empty" role="status">A carregar…</p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaDay implements OnInit {
  private readonly scheduling = inject(SchedulingService);
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Parâmetros do URL. */
  readonly date = input<string>();
  readonly doctorId = input<string>();

  protected readonly today = isoDate(new Date());
  protected readonly statuses = STATUS_LABELS;
  protected readonly types = TYPE_LABELS;
  protected readonly hhmm = hhmm;
  protected readonly canBook = computed(() => this.auth.hasAnyRole(ACCESS.appointmentBook));
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly appointments = signal<Appointment[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly day = signal(this.today);
  protected doctor = '';
  protected readonly hideClosed = signal(false);

  protected readonly visible = computed(() => {
    const list = this.appointments() ?? [];
    return this.hideClosed()
      ? list.filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
      : list;
  });

  protected readonly summary = computed(() => {
    const list = this.appointments() ?? [];
    const pending = list.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');
    const arrived = list.filter((a) => a.status === 'CHECKED_IN');
    return `${list.length} marcação(ões): ${pending.length} por atender, ${arrived.length} chegada(s).`;
  });

  ngOnInit(): void {
    this.day.set(this.date() || this.today);
    const me = this.auth.user();
    this.doctor =
      this.doctorId() ?? (me && me.roles.includes('DOCTOR') && !this.date() ? me.id : '');
    this.episodes.doctors().subscribe({
      next: (list) => this.doctors.set(list),
      error: () => this.doctors.set([]),
    });
    this.load();
  }

  protected shift(days: number): void {
    this.go(addDays(this.day(), days), this.doctor);
  }

  protected go(date: string, doctorId: string): void {
    if (!date) return;
    this.day.set(date);
    this.doctor = doctorId ?? '';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date, doctorId: this.doctor || null },
      replaceUrl: true,
    });
    this.load();
  }

  private load(): void {
    this.error.set(null);
    this.appointments.set(null);
    this.scheduling
      .appointments({ from: this.day(), to: this.day(), doctorId: this.doctor || null, size: 200 })
      .subscribe({
        next: (page) => this.appointments.set(page.content),
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
  }
}
