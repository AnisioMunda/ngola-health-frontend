import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { ANGOLA_PROVINCES } from '../../hospitals/data/hospital.model';
import {
  BLOOD_TYPES,
  GENDER_LABELS,
  Gender,
  Patient,
  PatientRequest,
  PatientSummary,
} from '../data/patient.model';
import { PatientService } from '../data/patient.service';

const NOT_BLANK = Validators.pattern(/\S/);
const PHONE = Validators.pattern(/^\+?[0-9 ()-]{6,20}$/);

/** Hoje no formato aaaa-mm-dd (fuso local), limite máximo da data de nascimento. */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Registo (/patients/new) e edição (/patients/:id/edit) de pacientes. */
@Component({
  selector: 'app-patient-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './patient-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientForm implements OnInit {
  private readonly patients = inject(PatientService);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly genders = Object.entries(GENDER_LABELS) as [Gender, string][];
  protected readonly bloodTypes = BLOOD_TYPES;
  protected readonly provinces = ANGOLA_PROVINCES;
  protected readonly maxDate = todayIso();
  protected readonly original = signal<Patient | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Possíveis duplicados encontrados antes de registar; o utilizador decide se continua. */
  protected readonly duplicates = signal<PatientSummary[] | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    fullName: [
      '',
      [Validators.required, NOT_BLANK, Validators.minLength(3), Validators.maxLength(200)],
    ],
    birthDate: ['', Validators.required],
    gender: ['' as Gender | '', Validators.required],
    nationalId: ['', Validators.pattern(/^(\d{9}[A-Za-z]{2}\d{3}|\d{10})$/)],
    healthCardNumber: ['', Validators.maxLength(30)],
    phone: ['', PHONE],
    email: ['', [Validators.email, Validators.maxLength(200)]],
    address: ['', Validators.maxLength(500)],
    province: ['', Validators.maxLength(100)],
    municipality: ['', Validators.maxLength(100)],
    emergencyContactName: ['', Validators.maxLength(200)],
    emergencyContactPhone: ['', PHONE],
    emergencyContactRelationship: ['', Validators.maxLength(50)],
    bloodType: [''],
    allergies: ['', Validators.maxLength(4000)],
    chronicConditions: ['', Validators.maxLength(4000)],
    notes: ['', Validators.maxLength(4000)],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.loading.set(true);
    this.patients.view(id).subscribe({
      next: (p) => {
        this.original.set(p);
        this.form.setValue({
          fullName: p.fullName,
          birthDate: p.birthDate,
          gender: p.gender,
          nationalId: p.nationalId ?? '',
          healthCardNumber: p.healthCardNumber ?? '',
          phone: p.phone ?? '',
          email: p.email ?? '',
          address: p.address ?? '',
          province: p.province ?? '',
          municipality: p.municipality ?? '',
          emergencyContactName: p.emergencyContactName ?? '',
          emergencyContactPhone: p.emergencyContactPhone ?? '',
          emergencyContactRelationship: p.emergencyContactRelationship ?? '',
          bloodType: p.bloodType ?? '',
          allergies: p.allergies ?? '',
          chronicConditions: p.chronicConditions ?? '',
          notes: p.notes ?? '',
        });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected errorFor(field: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    const server = control.errors?.['server'];
    return typeof server === 'string' ? server : FIELD_MESSAGES[field];
  }

  /** Num registo novo, procura duplicados primeiro; se houver, pede confirmação. */
  submit(): void {
    if (this.saving()) return;
    if (this.form.invalid || this.form.controls.birthDate.value > this.maxDate) {
      if (this.form.controls.birthDate.value > this.maxDate) {
        this.form.controls.birthDate.setErrors({ future: true });
      }
      this.form.markAllAsTouched();
      this.error.set('Corrija os campos assinalados antes de guardar.');
      return;
    }
    if (this.isEdit()) {
      this.save();
      return;
    }
    const request = this.toRequest();
    this.saving.set(true);
    this.error.set(null);
    this.patients
      .possibleDuplicates({
        fullName: request.fullName,
        birthDate: request.birthDate,
        nationalId: request.nationalId,
        phone: request.phone,
      })
      .subscribe({
        next: (found) => {
          this.saving.set(false);
          if (found.length > 0) {
            this.duplicates.set(found);
          } else {
            this.save();
          }
        },
        // A verificação é uma ajuda: se falhar, segue para o registo (o servidor valida o BI).
        error: () => {
          this.saving.set(false);
          this.save();
        },
      });
  }

  /** Confirmado que não é a mesma pessoa. */
  confirmNew(): void {
    this.duplicates.set(null);
    this.save();
  }

  protected cancelDuplicate(): void {
    this.duplicates.set(null);
  }

  private save(): void {
    const id = this.id();
    const request = this.toRequest();
    this.saving.set(true);
    this.error.set(null);
    (id ? this.patients.update(id, request) : this.patients.create(request)).subscribe({
      next: (saved) => {
        const notice = id
          ? 'Ficha actualizada.'
          : `Paciente registado com o processo ${saved.recordNumber}.`;
        void this.router.navigate(['/patients', saved.id], { state: { notice } });
      },
      error: (err: unknown) => {
        const apiError = toApiError(err);
        this.saving.set(false);
        this.error.set(apiError.message);
        for (const [field, message] of Object.entries(apiError.fieldErrors)) {
          const control = this.form.get(field);
          control?.setErrors({ server: message });
          control?.markAsTouched();
        }
      },
    });
  }

  private toRequest(): PatientRequest {
    const v = this.form.getRawValue();
    return {
      fullName: v.fullName.trim().replace(/\s+/g, ' '),
      birthDate: v.birthDate,
      gender: v.gender as Gender,
      nationalId: optional(v.nationalId)?.toUpperCase() ?? null,
      healthCardNumber: optional(v.healthCardNumber),
      phone: optional(v.phone),
      email: optional(v.email),
      address: optional(v.address),
      province: optional(v.province),
      municipality: optional(v.municipality),
      emergencyContactName: optional(v.emergencyContactName),
      emergencyContactPhone: optional(v.emergencyContactPhone),
      emergencyContactRelationship: optional(v.emergencyContactRelationship),
      bloodType: optional(v.bloodType),
      allergies: optional(v.allergies),
      chronicConditions: optional(v.chronicConditions),
      notes: optional(v.notes),
      version: this.original()?.version ?? null,
    };
  }
}

const FIELD_MESSAGES: Record<string, string> = {
  fullName: 'Indique o nome completo (3 a 200 caracteres).',
  birthDate: 'Indique uma data de nascimento válida (não futura).',
  gender: 'Seleccione o género.',
  nationalId: 'BI: 9 dígitos, 2 letras e 3 dígitos (ou NIF com 10 dígitos).',
  healthCardNumber: 'Máximo de 30 caracteres.',
  phone: 'Indique um telefone válido (ex.: +244 923 000 000).',
  email: 'Indique um correio electrónico válido.',
  emergencyContactPhone: 'Indique um telefone válido.',
};

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
