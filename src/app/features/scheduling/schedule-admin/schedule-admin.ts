import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Doctor } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import {
  Block,
  DAYS,
  DAY_LABELS,
  DayOfWeek,
  Schedule,
  hhmm,
  isoDate,
} from '../data/scheduling.model';
import { SchedulingService } from '../data/scheduling.service';

/** Horários semanais (administração/direcção) e ausências (também o próprio médico). */
@Component({
  selector: 'app-schedule-admin',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="..">← Agenda</a>
          <h1>Horários e ausências</h1>
        </div>
      </header>

      <div class="filters card">
        <label class="field"
          ><span>Médico</span>
          <select name="doctor" [ngModel]="doctor()" (ngModelChange)="doctor.set($event); load()">
            <option value="">Todos</option>
            @for (d of doctors(); track d.id) {
              <option [value]="d.id">{{ d.fullName }}</option>
            }
          </select>
        </label>
      </div>

      @if (message(); as m) {
        <div class="alert alert-success" role="status">{{ m }}</div>
      }
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      @if (affected().length > 0) {
        <div class="alert alert-warning" role="status">
          <p>
            Há {{ affected().length }} marcação(ões) no período da ausência. Não foram canceladas:
            contacte os pacientes e remarque.
          </p>
          <ul>
            @for (a of affected(); track a.id) {
              <li>
                <a [routerLink]="['../appointments', a.id]"
                  >{{ hhmm(a.startTime) }} — {{ a.patientName }}</a
                >
                {{ a.patientPhone ? '(' + a.patientPhone + ')' : '' }}
              </li>
            }
          </ul>
        </div>
      }

      <div class="card table-card">
        <h2>Horários semanais</h2>
        @if (schedules().length === 0) {
          <p class="empty">Nenhum horário activo.</p>
        } @else {
          <div class="table-scroll">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Médico</th>
                  <th scope="col">Dia</th>
                  <th scope="col">Horas</th>
                  <th scope="col">Vagas</th>
                  <th scope="col"><span class="visually-hidden">Acções</span></th>
                </tr>
              </thead>
              <tbody>
                @for (s of schedules(); track s.id) {
                  <tr>
                    <td>{{ s.doctorName }}</td>
                    <td>{{ days[s.dayOfWeek] }}</td>
                    <td>{{ hhmm(s.startTime) }}–{{ hhmm(s.endTime) }}</td>
                    <td>
                      {{ s.slotsPerDay }} × {{ s.slotMinutes }} min<span class="subtext"
                        >{{ s.capacity }} paciente(s) por vaga</span
                      >
                    </td>
                    <td class="actions">
                      @if (canManage()) {
                        <button
                          class="btn btn-small btn-secondary"
                          type="button"
                          [disabled]="busy()"
                          (click)="deactivate(s)"
                        >
                          Desactivar
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      @if (canManage()) {
        <form class="card" (ngSubmit)="createSchedule()">
          <h2>Novo horário</h2>
          <div class="grid">
            <label class="field">
              <span>Médico</span>
              <select name="sDoctor" [(ngModel)]="form.doctorId" required>
                <option value="">Seleccione…</option>
                @for (d of doctors(); track d.id) {
                  <option [value]="d.id">{{ d.fullName }}</option>
                }
              </select>
            </label>
            <label class="field">
              <span>Dia da semana</span>
              <select name="sDay" [(ngModel)]="form.dayOfWeek">
                @for (d of dayKeys; track d) {
                  <option [value]="d">{{ days[d] }}</option>
                }
              </select>
            </label>
            <label class="field"
              ><span>Início</span
              ><input type="time" name="sStart" [(ngModel)]="form.startTime" required
            /></label>
            <label class="field"
              ><span>Fim</span><input type="time" name="sEnd" [(ngModel)]="form.endTime" required
            /></label>
            <label class="field"
              ><span>Duração da vaga (min)</span
              ><input type="number" name="sSlot" min="5" max="240" [(ngModel)]="form.slotMinutes"
            /></label>
            <label class="field"
              ><span>Pacientes por vaga</span
              ><input type="number" name="sCap" min="1" max="20" [(ngModel)]="form.capacity"
            /></label>
          </div>
          <p class="muted">{{ preview() }}</p>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="busy() || !form.doctorId">
              Criar horário
            </button>
          </div>
        </form>
      }

      <div class="card table-card">
        <h2>Ausências (próximos 90 dias)</h2>
        @if (blocks().length === 0) {
          <p class="empty">Nenhuma ausência registada.</p>
        } @else {
          <ul class="blocks">
            @for (b of blocks(); track b.id) {
              <li>
                <span>
                  <strong>{{ b.date.split('-').reverse().join('/') }}</strong>
                  {{ b.allDay ? 'dia inteiro' : hhmm(b.startTime) + '–' + hhmm(b.endTime) }} ·
                  {{ b.doctorName }} — {{ b.reason }}
                </span>
                @if (canRemove(b)) {
                  <button
                    class="btn btn-small btn-secondary"
                    type="button"
                    [disabled]="busy()"
                    (click)="removeBlock(b)"
                  >
                    Remover
                  </button>
                }
              </li>
            }
          </ul>
        }
      </div>

      @if (canBlock()) {
        <form class="card" (ngSubmit)="createBlock()">
          <h2>Registar ausência</h2>
          <div class="grid">
            @if (canManage()) {
              <label class="field">
                <span>Médico</span>
                <select name="bDoctor" [(ngModel)]="blockForm.doctorId" required>
                  <option value="">Seleccione…</option>
                  @for (d of doctors(); track d.id) {
                    <option [value]="d.id">{{ d.fullName }}</option>
                  }
                </select>
              </label>
            }
            <label class="field"
              ><span>Data</span
              ><input type="date" name="bDate" [min]="today" [(ngModel)]="blockForm.date" required
            /></label>
            <label class="check-inline">
              <input type="checkbox" name="bAllDay" [(ngModel)]="blockForm.allDay" /> Dia inteiro
            </label>
            @if (!blockForm.allDay) {
              <label class="field"
                ><span>Das</span><input type="time" name="bStart" [(ngModel)]="blockForm.startTime"
              /></label>
              <label class="field"
                ><span>Às</span><input type="time" name="bEnd" [(ngModel)]="blockForm.endTime"
              /></label>
            }
            <label class="field span-2"
              ><span>Motivo</span
              ><input
                name="bReason"
                [(ngModel)]="blockForm.reason"
                maxlength="200"
                placeholder="Ex.: formação, férias"
            /></label>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="busy()">
              Registar ausência
            </button>
          </div>
        </form>
      }
    </section>
  `,
  styles: `
    .card {
      margin-bottom: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
    .table-card h2 {
      padding: var(--space-3) var(--space-4) 0;
    }
    .blocks {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .blocks li {
      display: flex;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
      border-top: 1px solid var(--color-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleAdmin implements OnInit {
  private readonly scheduling = inject(SchedulingService);
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);

  protected readonly today = isoDate(new Date());
  protected readonly days = DAY_LABELS;
  protected readonly dayKeys = DAYS;
  protected readonly hhmm = hhmm;
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.scheduleManage));
  protected readonly canBlock = computed(() => this.auth.hasAnyRole(ACCESS.scheduleBlock));
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly doctor = signal('');
  protected readonly schedules = signal<Schedule[]>([]);
  protected readonly blocks = signal<Block[]>([]);
  protected readonly affected = signal<Block['affectedAppointments']>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected form = {
    doctorId: '',
    dayOfWeek: 'MONDAY' as DayOfWeek,
    startTime: '08:00',
    endTime: '12:00',
    slotMinutes: 30,
    capacity: 1,
  };
  protected blockForm = {
    doctorId: '',
    date: this.today,
    allDay: true,
    startTime: '',
    endTime: '',
    reason: '',
  };

  ngOnInit(): void {
    const me = this.auth.user();
    if (me?.roles.includes('DOCTOR') && !this.canManage()) {
      this.doctor.set(me.id);
      this.blockForm.doctorId = me.id;
    }
    this.episodes.doctors().subscribe({
      next: (list) => this.doctors.set(list),
      error: () => this.doctors.set([]),
    });
    this.load();
  }

  protected preview(): string {
    const [sh, sm] = this.form.startTime.split(':').map(Number);
    const [eh, em] = this.form.endTime.split(':').map(Number);
    const minutes = eh * 60 + em - (sh * 60 + sm);
    const slots = this.form.slotMinutes > 0 ? Math.floor(minutes / this.form.slotMinutes) : 0;
    return minutes > 0 && slots > 0
      ? `${slots} vaga(s) de ${this.form.slotMinutes} min, até ${slots * this.form.capacity} paciente(s) por dia.`
      : 'Verifique as horas e a duração da vaga.';
  }

  protected canRemove(b: Block): boolean {
    return this.canManage() || b.doctorId === this.auth.user()?.id;
  }

  protected load(): void {
    const doctorId = this.doctor() || null;
    this.scheduling.schedules(doctorId).subscribe({
      next: (list) => this.schedules.set(list),
      error: (err: unknown) => this.fail(err),
    });
    this.scheduling.blocks({ doctorId }).subscribe({
      next: (list) => this.blocks.set(list),
      error: (err: unknown) => this.fail(err),
    });
  }

  protected createSchedule(): void {
    this.start();
    this.scheduling
      .createSchedule({
        ...this.form,
        startTime: this.form.startTime,
        endTime: this.form.endTime,
        slotMinutes: Number(this.form.slotMinutes),
        capacity: Number(this.form.capacity),
      })
      .subscribe({
        next: (s) =>
          this.done(`Horário criado: ${this.days[s.dayOfWeek]}, ${s.slotsPerDay} vagas.`),
        error: (err: unknown) => this.fail(err),
      });
  }

  protected deactivate(s: Schedule): void {
    this.start();
    this.scheduling.deactivateSchedule(s.id).subscribe({
      next: (r) =>
        this.done(
          r.futureAppointments
            ? `Horário desactivado. ${r.futureAppointments} marcação(ões) futura(s) mantêm-se: reveja-as na agenda.`
            : 'Horário desactivado.',
        ),
      error: (err: unknown) => this.fail(err),
    });
  }

  protected createBlock(): void {
    const f = this.blockForm;
    if (!f.reason.trim()) {
      this.error.set('Indique o motivo da ausência.');
      return;
    }
    this.start();
    this.scheduling
      .createBlock({
        doctorId: f.doctorId || this.auth.user()?.id || '',
        date: f.date,
        startTime: f.allDay ? null : f.startTime || null,
        endTime: f.allDay ? null : f.endTime || null,
        reason: f.reason.trim(),
      })
      .subscribe({
        next: (b) => {
          this.done('Ausência registada.');
          this.affected.set(b.affectedAppointments);
          this.blockForm.reason = '';
        },
        error: (err: unknown) => this.fail(err),
      });
  }

  protected removeBlock(b: Block): void {
    this.start();
    this.scheduling.deleteBlock(b.id).subscribe({
      next: () => this.done('Ausência removida.'),
      error: (err: unknown) => this.fail(err),
    });
  }

  private start(): void {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    this.affected.set([]);
  }

  private done(message: string): void {
    this.busy.set(false);
    this.message.set(message);
    this.load();
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(toApiError(err).message);
  }
}
