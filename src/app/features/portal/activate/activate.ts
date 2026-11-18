import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PASSWORD_HINT, strongPassword } from '../../../core/auth/password-policy';
import { toApiError } from '../../../core/http/api-error';
import { PortalService } from '../data/portal.service';

/** Activação da conta do portal com o código entregue na recepção (página pública). */
@Component({
  selector: 'app-portal-activate',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="card auth-card">
        <h1>Activar a minha conta</h1>
        @if (done()) {
          <div class="alert alert-success" role="status">
            Conta activada. Já pode entrar com o seu nome de utilizador e a senha que escolheu.
          </div>
          <a class="btn btn-primary" routerLink="/login">Entrar</a>
        } @else {
          <p class="muted">
            Use o código que lhe entregaram na recepção do hospital. É válido durante 3 dias e só
            pode ser usado uma vez.
          </p>
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label class="field">
              <span>Código de activação</span>
              <input
                formControlName="code"
                autocomplete="one-time-code"
                placeholder="XXXXX-XXXXX"
                autocapitalize="characters"
              />
            </label>
            <label class="field">
              <span>Data de nascimento</span>
              <input type="date" formControlName="birthDate" />
            </label>
            <label class="field">
              <span>Nome de utilizador (para entrar)</span>
              <input formControlName="username" autocomplete="username" />
            </label>
            <label class="field">
              <span>Correio electrónico</span>
              <input type="email" formControlName="email" autocomplete="email" />
            </label>
            <label class="field">
              <span>Senha</span>
              <input type="password" formControlName="password" autocomplete="new-password" />
              <small class="muted">{{ hint }}</small>
            </label>
            <label class="field">
              <span>Repita a senha</span>
              <input type="password" formControlName="confirm" autocomplete="new-password" />
            </label>
            @if (error(); as e) {
              <div class="alert alert-error" role="alert">{{ e }}</div>
            }
            <button class="btn btn-primary" type="submit" [disabled]="busy()">
              {{ busy() ? 'A activar…' : 'Activar conta' }}
            </button>
          </form>
          <p class="muted small"><a routerLink="/login">Já tenho conta</a></p>
        }
      </section>
    </main>
  `,
  styles: `
    .auth-page {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: var(--space-4);
    }
    .auth-card {
      width: min(28rem, 100%);
    }
    form {
      display: grid;
      gap: var(--space-3);
    }
    .small {
      font-size: 0.85rem;
      margin-top: var(--space-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Activate {
  private readonly portal = inject(PortalService);
  private readonly fb = inject(FormBuilder);

  protected readonly hint = PASSWORD_HINT;
  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    birthDate: ['', Validators.required],
    username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._-]{3,50}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPassword]],
    confirm: ['', Validators.required],
  });

  protected submit(): void {
    const v = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        this.form.controls.password.invalid
          ? 'A senha não cumpre as regras.'
          : this.form.controls.username.invalid
            ? 'O nome de utilizador só pode ter letras sem acentos, números, pontos, hífenes ou sublinhados (3 a 50).'
            : 'Preencha todos os campos.',
      );
      return;
    }
    if (v.password !== v.confirm) {
      this.error.set('As senhas não coincidem.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.portal
      .activate({
        code: v.code.trim(),
        birthDate: v.birthDate,
        username: v.username.trim(),
        email: v.email.trim(),
        password: v.password,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.done.set(true);
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.error.set(toApiError(err).message);
        },
      });
  }
}
