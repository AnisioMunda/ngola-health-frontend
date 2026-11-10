import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { safeReturnUrl } from '../../../core/auth/auth.guards';
import { AuthService } from '../../../core/auth/auth.service';
import { PASSWORD_HINT, strongPassword } from '../../../core/auth/password-policy';
import { toApiError } from '../../../core/http/api-error';

function samePasswords(group: AbstractControl): ValidationErrors | null {
  const value = group.value as { newPassword: string; confirmation: string };
  return value.confirmation && value.newPassword !== value.confirmation ? { mismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();

  protected readonly hint = PASSWORD_HINT;
  protected readonly mandatory = computed(() => this.auth.user()?.mustChangePassword ?? false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, strongPassword]],
      confirmation: ['', Validators.required],
    },
    { validators: samePasswords },
  );

  submit(): void {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
      error: (err: unknown) => {
        const apiError = toApiError(err);
        this.submitting.set(false);
        this.error.set(apiError.fieldErrors['newPassword'] ?? apiError.message);
      },
    });
  }

  cancel(): void {
    void this.router.navigateByUrl('/');
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
