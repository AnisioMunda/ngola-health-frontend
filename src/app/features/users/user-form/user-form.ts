import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import {
  PASSWORD_HINT,
  generateTemporaryPassword,
  strongPassword,
} from '../../../core/auth/password-policy';
import { ROLE_LABELS, Role, STAFF_ROLES } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Hospital } from '../../hospitals/data/hospital.model';
import { HospitalService } from '../../hospitals/data/hospital.service';
import { User } from '../data/user.model';
import { UserService } from '../data/user.service';

const NOT_BLANK = Validators.pattern(/\S/);

/** Registo e edição de utilizador (/users/new ou /users/:id/edit). */
@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private readonly users = inject(UserService);
  private readonly hospitalService = inject(HospitalService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly isSuperAdmin = computed(() => this.auth.hasAnyRole(['SUPER_ADMIN']));
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly passwordHint = PASSWORD_HINT;
  protected readonly hospitals = signal<Hospital[]>([]);
  protected readonly original = signal<User | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Senha temporária acabada de repor, mostrada uma única vez. */
  protected readonly resetResult = signal<string | null>(null);
  protected readonly resetting = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    fullName: [
      '',
      [Validators.required, NOT_BLANK, Validators.minLength(3), Validators.maxLength(200)],
    ],
    username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._-]{3,50}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phone: ['', Validators.pattern(/^\+?[0-9 ()-]{6,20}$/)],
    specialty: ['', Validators.maxLength(100)],
    professionalCardNumber: ['', Validators.maxLength(50)],
    roles: [[] as Role[], Validators.required],
    hospitalId: [''],
    temporaryPassword: ['', [Validators.required, strongPassword]],
  });

  private readonly selectedRoles = toSignal(
    this.form.controls.roles.valueChanges.pipe(startWith(this.form.controls.roles.value)),
    { requireSync: true },
  );
  protected readonly isPlatformAdminAccount = computed(() =>
    this.selectedRoles().includes('SUPER_ADMIN'),
  );
  /** O SUPER_ADMIN é exclusivo e não se converte em perfil de hospital (nem o contrário). */
  protected readonly availableRoles = computed<Role[]>(() => {
    if (this.isEdit()) {
      return this.original()?.roles.includes('SUPER_ADMIN') ? ['SUPER_ADMIN'] : STAFF_ROLES;
    }
    return this.isSuperAdmin() ? ['SUPER_ADMIN', ...STAFF_ROLES] : STAFF_ROLES;
  });

  ngOnInit(): void {
    if (this.isSuperAdmin()) {
      this.hospitalService.findActive().subscribe({ next: (list) => this.hospitals.set(list) });
    }
    const id = this.id();
    if (id) {
      this.form.controls.username.disable();
      this.form.controls.temporaryPassword.disable();
      this.load(id);
    } else {
      this.form.controls.temporaryPassword.setValue(generateTemporaryPassword());
    }
  }

  protected hasRole(role: Role): boolean {
    return this.selectedRoles().includes(role);
  }

  protected toggleRole(role: Role, checked: boolean): void {
    const control = this.form.controls.roles;
    let roles = control.value.filter((r) => r !== role);
    if (checked) {
      // SUPER_ADMIN não se combina com outros perfis.
      roles =
        role === 'SUPER_ADMIN'
          ? ['SUPER_ADMIN']
          : [...roles.filter((r) => r !== 'SUPER_ADMIN'), role];
    }
    control.setValue(roles);
    control.markAsTouched();
  }

  protected regeneratePassword(): void {
    this.form.controls.temporaryPassword.setValue(generateTemporaryPassword());
  }

  protected errorFor(field: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    const server = control.errors?.['server'];
    return typeof server === 'string' ? server : FIELD_MESSAGES[field];
  }

  submit(): void {
    if (this.saving()) return;
    const needsHospital = this.isSuperAdmin() && !this.isPlatformAdminAccount();
    if (needsHospital && !this.form.controls.hospitalId.value) {
      this.form.controls.hospitalId.setErrors({ required: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Corrija os campos assinalados antes de guardar.');
      return;
    }
    const v = this.form.getRawValue();
    const common = {
      fullName: v.fullName.trim(),
      email: v.email.trim(),
      phone: optional(v.phone),
      specialty: optional(v.specialty),
      professionalCardNumber: optional(v.professionalCardNumber),
      roles: v.roles,
      hospitalId: needsHospital ? v.hospitalId : null,
    };
    const id = this.id();
    const action = id
      ? this.users.update(id, { ...common, version: this.original()?.version ?? null })
      : this.users.create({
          ...common,
          username: v.username.trim().toLowerCase(),
          temporaryPassword: v.temporaryPassword,
        });

    this.saving.set(true);
    this.error.set(null);
    action.subscribe({
      next: (saved) => {
        const notice = id
          ? `${saved.fullName} foi actualizado.`
          : `${saved.fullName} foi criado. Comunique-lhe a senha temporária.`;
        void this.router.navigate(['/users'], { state: { notice } });
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
        const fieldByCode: Record<string, string> = {
          USERNAME_IN_USE: 'username',
          EMAIL_IN_USE: 'email',
          HOSPITAL_REQUIRED: 'hospitalId',
          HOSPITAL_INACTIVE: 'hospitalId',
        };
        const field = fieldByCode[apiError.code];
        if (field) this.form.get(field)?.setErrors({ server: apiError.message });
      },
    });
  }

  resetPassword(): void {
    const user = this.original();
    if (!user || this.resetting()) return;
    if (!confirm(`Repor a senha de ${user.fullName}? As sessões abertas terminam de imediato.`))
      return;
    const password = generateTemporaryPassword();
    this.resetting.set(true);
    this.users.resetPassword(user.id, password).subscribe({
      next: (updated) => {
        this.original.set(updated);
        this.resetResult.set(password);
        this.resetting.set(false);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.resetting.set(false);
      },
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.users.findById(id).subscribe({
      next: (user) => {
        this.original.set(user);
        this.form.patchValue({
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone ?? '',
          specialty: user.specialty ?? '',
          professionalCardNumber: user.professionalCardNumber ?? '',
          roles: user.roles,
          hospitalId: user.hospitalId ?? '',
        });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }
}

const FIELD_MESSAGES: Record<string, string> = {
  fullName: 'Indique o nome completo (3 a 200 caracteres).',
  username: 'Use 3 a 50 letras sem acentos, números, pontos, hífenes ou sublinhados.',
  email: 'Indique um correio electrónico válido.',
  phone: 'Indique um telefone válido (ex.: +244 923 000 000).',
  specialty: 'Máximo de 100 caracteres.',
  professionalCardNumber: 'Máximo de 50 caracteres.',
  roles: 'Seleccione pelo menos um perfil.',
  hospitalId: 'Seleccione o hospital.',
  temporaryPassword: PASSWORD_HINT,
};

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
