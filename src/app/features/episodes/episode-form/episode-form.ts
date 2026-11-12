import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { PatientSummary } from '../../patients/data/patient.model';
import { PatientService } from '../../patients/data/patient.service';
import { PatientPicker } from '../../../shared/patient-picker/patient-picker';
import { Doctor, EpisodeType, TYPE_LABELS } from '../data/episode.model';
import { EpisodeService } from '../data/episode.service';

/** Data/hora local actual no formato do input datetime-local. */
function nowLocal(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Abrir episódio. Com ?patientId= (vindo da ficha) o paciente já vem escolhido. */
@Component({
  selector: 'app-episode-form',
  imports: [ReactiveFormsModule, RouterLink, PatientPicker],
  templateUrl: './episode-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeForm implements OnInit {
  private readonly episodes = inject(EpisodeService);
  private readonly patients = inject(PatientService);
  private readonly router = inject(Router);

  readonly patientId = input<string>();

  protected readonly types = Object.entries(TYPE_LABELS) as [EpisodeType, string][];
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly patient = signal<{
    id: string;
    fullName: string;
    recordNumber: string;
  } | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    type: ['OUTPATIENT' as EpisodeType, Validators.required],
    doctorId: [''],
    scheduledAt: [nowLocal(), Validators.required],
    reason: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.episodes.doctors().subscribe({ next: (list) => this.doctors.set(list) });
    const id = this.patientId();
    if (id) {
      this.patients.view(id).subscribe({
        next: (p) =>
          this.patient.set({ id: p.id, fullName: p.fullName, recordNumber: p.recordNumber }),
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
    }
  }

  protected choose(p: PatientSummary): void {
    this.patient.set({ id: p.id, fullName: p.fullName, recordNumber: p.recordNumber });
  }

  protected clearPatient(): void {
    this.patient.set(null);
  }

  submit(): void {
    if (this.saving()) return;
    const patient = this.patient();
    if (!patient || this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(patient ? 'Corrija os campos assinalados.' : 'Seleccione o paciente.');
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.episodes
      .create({
        patientId: patient.id,
        type: v.type,
        doctorId: v.doctorId || null,
        scheduledAt: new Date(v.scheduledAt).toISOString(),
        reason: v.reason.trim(),
      })
      .subscribe({
        next: (episode) => void this.router.navigate(['/episodes', episode.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(toApiError(err).message);
        },
      });
  }
}
