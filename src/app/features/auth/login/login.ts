import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { safeReturnUrl } from '../../../core/auth/auth.guards';
import { AuthService } from '../../../core/auth/auth.service';
import { toApiError } from '../../../core/http/api-error';
import { SystemStatusService } from '../../../core/system/system-status.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Parâmetros de query (withComponentInputBinding). */
  readonly returnUrl = input<string>();
  readonly reason = input<string>();

  protected readonly backendStatus = toSignal(inject(SystemStatusService).checkBackend());
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { login, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.auth.login(login.trim(), password).subscribe({
      next: (user) => {
        const target = safeReturnUrl(this.returnUrl());
        if (user.mustChangePassword) {
          void this.router.navigate(['/change-password'], { queryParams: { returnUrl: target } });
        } else {
          void this.router.navigateByUrl(target);
        }
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.error.set(toApiError(err).message);
        this.form.controls.password.reset();
      },
    });
  }
}
