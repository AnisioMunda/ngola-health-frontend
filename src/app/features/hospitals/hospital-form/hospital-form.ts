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
import {
  ANGOLA_PROVINCES,
  HOSPITAL_TYPES,
  Hospital,
  HospitalRequest,
  HospitalType,
} from '../data/hospital.model';
import { HospitalService } from '../data/hospital.service';

/** Não aceita texto só com espaços. */
const NOT_BLANK = Validators.pattern(/\S/);

/** Formulário de registo e edição de hospital (rota /hospitals/new ou /hospitals/:id/edit). */
@Component({
  selector: 'app-hospital-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './hospital-form.html',
  styleUrl: './hospital-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalForm implements OnInit {
  private readonly hospitals = inject(HospitalService);
  private readonly router = inject(Router);

  /** Parâmetro de rota (ligado por withComponentInputBinding). */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly types = HOSPITAL_TYPES;
  protected readonly provinces = ANGOLA_PROVINCES;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Hospital carregado na edição (null num registo novo ou se o carregamento falhou). */
  protected readonly original = signal<Hospital | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, NOT_BLANK, Validators.maxLength(200)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,20}$/)]],
    type: ['' as HospitalType | '', Validators.required],
    province: ['', [Validators.required, NOT_BLANK, Validators.maxLength(100)]],
    municipality: ['', Validators.maxLength(100)],
    address: ['', Validators.maxLength(500)],
    phone: ['', Validators.pattern(/^\+?[0-9 ()-]{6,20}$/)],
    email: ['', [Validators.email, Validators.maxLength(200)]],
    taxId: ['', Validators.pattern(/^[A-Za-z0-9]{9,14}$/)],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) this.loadHospital(id);
  }

  /** Mantém o código em maiúsculas enquanto se escreve. */
  normalizeCode(): void {
    const control = this.form.controls.code;
    const upper = control.value.toUpperCase();
    if (upper !== control.value) control.setValue(upper);
  }

  /** Mensagem de erro de um campo, já tocado e inválido (validação local ou do servidor). */
  protected errorFor(field: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    const errors = control.errors ?? {};
    if (typeof errors['server'] === 'string') return errors['server'];
    return FIELD_MESSAGES[field];
  }

  submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Corrija os campos assinalados antes de guardar.');
      return;
    }
    const id = this.id();
    const request = this.toRequest();
    this.saving.set(true);
    this.error.set(null);
    (id ? this.hospitals.update(id, request) : this.hospitals.create(request)).subscribe({
      next: (saved) => {
        const notice = id ? `${saved.name} foi actualizado.` : `${saved.name} foi registado.`;
        void this.router.navigate(['/hospitals'], { state: { notice } });
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
        if (apiError.code === 'HOSPITAL_CODE_IN_USE') {
          this.form.controls.code.setErrors({ server: apiError.message });
        }
      },
    });
  }

  private loadHospital(id: string): void {
    this.loading.set(true);
    this.hospitals.findById(id).subscribe({
      next: (hospital) => {
        this.original.set(hospital);
        this.form.setValue({
          name: hospital.name,
          code: hospital.code,
          type: hospital.type,
          province: hospital.province,
          municipality: hospital.municipality ?? '',
          address: hospital.address ?? '',
          phone: hospital.phone ?? '',
          email: hospital.email ?? '',
          taxId: hospital.taxId ?? '',
        });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  private toRequest(): HospitalRequest {
    const v = this.form.getRawValue();
    return {
      name: v.name.trim(),
      code: v.code.trim().toUpperCase(),
      type: v.type as HospitalType,
      province: v.province.trim(),
      municipality: optional(v.municipality),
      address: optional(v.address),
      phone: optional(v.phone),
      email: optional(v.email),
      taxId: optional(v.taxId),
      version: this.original()?.version ?? null,
    };
  }
}

const FIELD_MESSAGES: Record<string, string> = {
  name: 'Indique o nome (até 200 caracteres).',
  code: 'Use 3 a 20 letras, números ou hífenes.',
  type: 'Seleccione o tipo de instituição.',
  province: 'Indique a província.',
  municipality: 'Máximo de 100 caracteres.',
  address: 'Máximo de 500 caracteres.',
  phone: 'Indique um telefone válido (ex.: +244 923 000 000).',
  email: 'Indique um correio electrónico válido.',
  taxId: 'O NIF deve ter 9 a 14 letras ou números.',
};

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
