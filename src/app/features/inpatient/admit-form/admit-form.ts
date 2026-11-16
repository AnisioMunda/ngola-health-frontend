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
import { PatientService } from '../../patients/data/patient.service';
import { BED_TYPE_LABELS, Bed, GENDER_POLICY_LABELS, Ward } from '../data/inpatient.model';
import { InpatientService } from '../data/inpatient.service';

/**
 * Internar (/inpatient/admit?patientId=…&originEpisodeId=…&wardId=…&bedId=…). Só mostra
 * enfermarias compatíveis com o sexo do doente e camas livres.
 */
@Component({
  selector: 'app-admit-form',
  imports: [FormsModule, RouterLink, PatientPicker],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/inpatient">← Internamento</a>
          <h1>Internar doente</h1>
          @if (originEpisodeId()) {
            <p class="muted">A partir do episódio em curso.</p>
          }
        </div>
      </header>

      <div class="card">
        <h2>Doente</h2>
        @if (patient(); as p) {
          <p>
            <strong>{{ p.fullName }}</strong> · processo <code>{{ p.recordNumber }}</code> ·
            {{ p.age }} anos
            @if (!originEpisodeId()) {
              <button class="btn-link" type="button" (click)="patient.set(null)">Trocar</button>
            }
          </p>
        } @else {
          <app-patient-picker (picked)="patient.set($event)" />
        }
      </div>

      <div class="card">
        <h2>Cama</h2>
        <div class="grid">
          <label class="field">
            <span>Enfermaria</span>
            <select name="ward" [ngModel]="ward()" (ngModelChange)="selectWard($event)">
              <option value="">Seleccione…</option>
              @for (w of suitableWards(); track w.id) {
                <option [value]="w.id" [disabled]="w.available === 0">
                  {{ w.name }} ({{ genders[w.genderPolicy] }}) — {{ w.available }} livre(s)
                </option>
              }
            </select>
          </label>
          <label class="field">
            <span>Cama livre</span>
            <select
              name="bed"
              [ngModel]="bed()"
              (ngModelChange)="bed.set($event)"
              [disabled]="!ward()"
            >
              <option value="">Seleccione…</option>
              @for (b of freeBeds(); track b.id) {
                <option [value]="b.id">
                  {{ b.code }}{{ b.type !== 'STANDARD' ? ' — ' + bedTypes[b.type] : '' }}
                </option>
              }
            </select>
          </label>
        </div>
        @if (patient() && suitableWards().length === 0) {
          <p class="muted">Nenhuma enfermaria activa recebe este doente.</p>
        }
      </div>

      <div class="card">
        <div class="grid">
          <label class="field">
            <span>Médico responsável</span>
            <select name="doctor" [(ngModel)]="doctorId">
              @for (d of doctors(); track d.id) {
                <option [value]="d.id">{{ d.fullName }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Alta prevista (opcional)</span>
            <input type="date" name="expected" [(ngModel)]="expected" />
          </label>
          <label class="field span-2">
            <span>Motivo do internamento</span>
            <textarea name="reason" [(ngModel)]="reason" rows="2" maxlength="500"></textarea>
          </label>
        </div>
      </div>

      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="form-actions">
        <a class="btn btn-secondary" routerLink="/inpatient">Cancelar</a>
        <button
          class="btn btn-primary"
          type="button"
          [disabled]="!patient() || !bed() || saving()"
          (click)="submit()"
        >
          {{ saving() ? 'A internar…' : 'Internar' }}
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
export class AdmitForm implements OnInit {
  private readonly inpatient = inject(InpatientService);
  private readonly patients = inject(PatientService);
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly patientId = input<string>();
  readonly originEpisodeId = input<string>();
  readonly wardId = input<string>();
  readonly bedId = input<string>();

  protected readonly genders = GENDER_POLICY_LABELS;
  protected readonly bedTypes = BED_TYPE_LABELS;
  protected readonly patient = signal<PatientSummary | null>(null);
  protected readonly wards = signal<Ward[]>([]);
  protected readonly beds = signal<Bed[]>([]);
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly ward = signal('');
  protected readonly bed = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected doctorId = '';
  protected expected = '';
  protected reason = '';

  protected readonly suitableWards = computed(() => {
    const gender = this.patient()?.gender;
    return this.wards().filter(
      (w) => w.genderPolicy === 'MIXED' || !gender || w.genderPolicy === gender,
    );
  });
  protected readonly freeBeds = computed(() =>
    this.beds().filter((b) => b.active && b.status === 'AVAILABLE'),
  );

  ngOnInit(): void {
    this.doctorId = this.auth.user()?.id ?? '';
    this.episodes.doctors().subscribe({
      next: (list) => this.doctors.set(list),
      error: () => this.doctors.set([]),
    });
    this.inpatient.wards().subscribe({
      next: (list) => this.wards.set(list),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
    const patientId = this.patientId();
    if (patientId) {
      this.patients.view(patientId).subscribe({
        next: (p) => this.patient.set(p),
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
    }
    const wardId = this.wardId();
    if (wardId) this.selectWard(wardId, this.bedId() ?? '');
  }

  protected selectWard(wardId: string, bedId = ''): void {
    this.ward.set(wardId);
    this.bed.set('');
    this.beds.set([]);
    if (!wardId) return;
    this.inpatient.map(wardId).subscribe({
      next: (m) => {
        this.beds.set(m.beds);
        if (bedId && m.beds.some((b) => b.id === bedId && b.status === 'AVAILABLE')) {
          this.bed.set(bedId);
        }
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected submit(): void {
    const patient = this.patient();
    if (!patient || !this.bed()) return;
    if (!this.reason.trim()) {
      this.error.set('Indique o motivo do internamento.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.inpatient
      .admit({
        patientId: patient.id,
        bedId: this.bed(),
        responsibleDoctorId: this.doctorId || null,
        originEpisodeId: this.originEpisodeId() ?? null,
        reason: this.reason.trim(),
        expectedDischargeDate: this.expected || null,
      })
      .subscribe({
        next: (a) => void this.router.navigate(['/inpatient/admissions', a.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(toApiError(err).message);
        },
      });
  }
}
