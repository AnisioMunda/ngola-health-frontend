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

import { AuthService } from '../../../core/auth/auth.service';
import { toApiError } from '../../../core/http/api-error';
import { PatientPicker } from '../../../shared/patient-picker/patient-picker';
import { Doctor } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import { PatientSummary } from '../../patients/data/patient.model';
import { AppointmentType, TYPE_LABELS, hhmm, isoDate } from '../data/scheduling.model';
import { SchedulingService } from '../data/scheduling.service';
import { SlotPicker } from '../slot-picker/slot-picker';

/** Nova marcação: paciente, médico, dia e vaga livre (/scheduling/new?date=…&doctorId=…). */
@Component({
  selector: 'app-appointment-form',
  imports: [FormsModule, RouterLink, PatientPicker, SlotPicker],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="..">← Agenda</a>
          <h1>Nova marcação</h1>
        </div>
      </header>

      <div class="card">
        <h2>Paciente</h2>
        @if (patient(); as p) {
          <p>
            <strong>{{ p.fullName }}</strong> · processo <code>{{ p.recordNumber }}</code>
            {{ p.phone ? '· ' + p.phone : '' }}
            <button class="btn-link" type="button" (click)="patient.set(null)">Trocar</button>
          </p>
        } @else {
          <app-patient-picker (picked)="patient.set($event)" />
        }
      </div>

      <div class="card">
        <h2>Médico e vaga</h2>
        <div class="grid">
          <label class="field">
            <span>Médico</span>
            <select name="doctor" [ngModel]="doctor()" (ngModelChange)="doctor.set($event)">
              <option value="">Seleccione…</option>
              @for (d of doctors(); track d.id) {
                <option [value]="d.id">
                  {{ d.fullName }}{{ d.specialty ? ' — ' + d.specialty : '' }}
                </option>
              }
            </select>
          </label>
          <label class="field">
            <span>Data</span>
            <input
              type="date"
              name="day"
              [min]="today"
              [ngModel]="day()"
              (ngModelChange)="day.set($event)"
            />
          </label>
        </div>
        <app-slot-picker [doctorId]="doctor() || null" [date]="day() || null" [(selected)]="slot" />
      </div>

      <div class="card">
        <div class="grid">
          <label class="field">
            <span>Tipo</span>
            <select name="type" [(ngModel)]="type">
              @for (t of typeKeys; track t) {
                <option [value]="t">{{ types[t] }}</option>
              }
            </select>
          </label>
          <label class="field span-2">
            <span>Motivo</span>
            <input
              name="reason"
              [(ngModel)]="reason"
              maxlength="300"
              placeholder="Ex.: dor lombar, controlo da tensão"
            />
          </label>
          <label class="field span-2">
            <span>Observações (opcional)</span>
            <textarea name="notes" [(ngModel)]="notes" rows="2" maxlength="1000"></textarea>
          </label>
        </div>
      </div>

      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="form-actions">
        <a class="btn btn-secondary" routerLink="..">Cancelar</a>
        <button
          class="btn btn-primary"
          type="button"
          [disabled]="!ready() || saving()"
          (click)="submit()"
        >
          {{ saving() ? 'A marcar…' : slot() ? 'Marcar às ' + hhmm(slot()) : 'Marcar' }}
        </button>
      </div>
    </section>
  `,
  styles: `
    .card + .card {
      margin-top: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentForm implements OnInit {
  private readonly scheduling = inject(SchedulingService);
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly date = input<string>();
  readonly doctorId = input<string>();

  protected readonly today = isoDate(new Date());
  protected readonly types = TYPE_LABELS;
  protected readonly typeKeys = Object.keys(TYPE_LABELS) as AppointmentType[];
  protected readonly hhmm = hhmm;
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly patient = signal<PatientSummary | null>(null);
  protected readonly doctor = signal('');
  protected readonly day = signal('');
  protected readonly slot = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected type: AppointmentType = 'CONSULTATION';
  protected reason = '';
  protected notes = '';

  protected readonly ready = computed(
    () => !!this.patient() && !!this.doctor() && !!this.day() && !!this.slot(),
  );

  ngOnInit(): void {
    const date = this.date();
    this.day.set(date && date >= this.today ? date : this.today);
    const me = this.auth.user();
    this.doctor.set(this.doctorId() ?? (me?.roles.includes('DOCTOR') ? me.id : ''));
    this.episodes.doctors().subscribe({
      next: (list) => this.doctors.set(list),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected submit(): void {
    const patient = this.patient();
    const slot = this.slot();
    if (!patient || !slot) return;
    if (!this.reason.trim()) {
      this.error.set('Indique o motivo.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.scheduling
      .book({
        patientId: patient.id,
        doctorId: this.doctor(),
        type: this.type,
        date: this.day(),
        startTime: slot,
        reason: this.reason.trim(),
        notes: this.notes.trim() || null,
      })
      .subscribe({
        next: (a) => void this.router.navigate(['/scheduling/appointments', a.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(toApiError(err).message);
        },
      });
  }
}
