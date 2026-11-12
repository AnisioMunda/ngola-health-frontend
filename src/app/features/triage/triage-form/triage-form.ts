import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { PatientPicker } from '../../../shared/patient-picker/patient-picker';
import { GENDER_LABELS, Gender, PatientSummary } from '../../patients/data/patient.model';
import { PRIORITIES, PRIORITY_LABELS, TriagePriority } from '../data/triage.model';
import { TriageService } from '../data/triage.service';

const range = (min: number, max: number) => [Validators.min(min), Validators.max(max)];

/** Nova triagem: doente registado ou provisório, prioridade obrigatória. */
@Component({
  selector: 'app-triage-form',
  imports: [ReactiveFormsModule, RouterLink, PatientPicker],
  templateUrl: './triage-form.html',
  styleUrl: './triage-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriageForm {
  private readonly triage = inject(TriageService);
  private readonly router = inject(Router);

  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly genders = Object.entries(GENDER_LABELS) as [Gender, string][];
  protected readonly mode = signal<'registered' | 'provisional'>('registered');
  protected readonly patient = signal<PatientSummary | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).group({
    tempName: [''],
    tempAge: [null as number | null, range(0, 130)],
    tempGender: ['' as Gender | ''],
    priority: ['' as TriagePriority | '', Validators.required],
    chiefComplaint: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)],
    ],
    painScale: [null as number | null, range(0, 10)],
    notes: ['', Validators.maxLength(4000)],
    systolicBp: [null as number | null, range(40, 300)],
    diastolicBp: [null as number | null, range(20, 200)],
    heartRate: [null as number | null, range(20, 250)],
    respiratoryRate: [null as number | null, range(4, 80)],
    temperature: [null as number | null, range(30, 45)],
    oxygenSaturation: [null as number | null, range(50, 100)],
  });

  protected setMode(mode: 'registered' | 'provisional'): void {
    this.mode.set(mode);
    if (mode === 'provisional') {
      this.patient.set(null);
      if (!this.form.controls.tempName.value) this.form.controls.tempName.setValue('Desconhecido');
    }
  }

  submit(): void {
    if (this.saving()) return;
    const provisional = this.mode() === 'provisional';
    if (!provisional && !this.patient()) {
      this.error.set('Seleccione o paciente ou registe-o como provisório.');
      return;
    }
    if (provisional && !this.form.controls.tempName.value?.trim()) {
      this.form.controls.tempName.setErrors({ required: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        this.form.controls.priority.invalid
          ? 'Seleccione a prioridade.'
          : 'Corrija os campos assinalados.',
      );
      return;
    }
    const v = this.form.getRawValue();
    const vitals = {
      systolicBp: v.systolicBp,
      diastolicBp: v.diastolicBp,
      heartRate: v.heartRate,
      respiratoryRate: v.respiratoryRate,
      temperature: v.temperature,
      oxygenSaturation: v.oxygenSaturation,
    };
    this.saving.set(true);
    this.error.set(null);
    this.triage
      .create({
        patientId: provisional ? null : this.patient()!.id,
        tempName: provisional ? v.tempName!.trim() : null,
        tempAge: provisional ? v.tempAge : null,
        tempGender: provisional && v.tempGender ? v.tempGender : null,
        priority: v.priority as TriagePriority,
        chiefComplaint: v.chiefComplaint!.trim(),
        painScale: v.painScale,
        notes: v.notes?.trim() || null,
        vitals: Object.values(vitals).some((x) => x !== null) ? vitals : null,
      })
      .subscribe({
        next: (t) =>
          void this.router.navigate(['/triage'], {
            state: { notice: `Senha ${t.queueNumber} atribuída a ${t.displayName}.` },
          }),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.saving.set(false);
          const fields = Object.values(apiError.fieldErrors);
          this.error.set(
            fields.length ? `${apiError.message} ${fields.join(' ')}` : apiError.message,
          );
        },
      });
  }
}
