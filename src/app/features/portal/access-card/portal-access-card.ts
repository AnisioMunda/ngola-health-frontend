import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { PortalStatus } from '../data/portal.model';
import { PortalService } from '../data/portal.service';

/**
 * Na ficha do doente: estado do acesso ao portal e código de activação. O código só aparece uma
 * vez — entrega-se em mão, depois de confirmar a identidade do doente.
 */
@Component({
  selector: 'app-portal-access-card',
  imports: [DatePipe],
  template: `
    <div class="card">
      <h2>Portal do paciente</h2>
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      @if (status(); as s) {
        @if (s.hasAccount) {
          <p>
            Conta <strong>{{ s.username }}</strong> ({{ s.email }})
            <span class="badge" [class.badge-success]="s.accountActive">{{
              s.accountActive ? 'Activa' : 'Desactivada'
            }}</span>
          </p>
          <p class="muted">
            Último acesso:
            {{ s.lastLoginAt ? (s.lastLoginAt | date: 'dd/MM/yyyy HH:mm') : 'nunca' }}
          </p>
          @if (canAdmin()) {
            <button
              class="btn btn-small btn-secondary"
              type="button"
              [disabled]="busy()"
              (click)="toggle(!s.accountActive)"
            >
              {{ s.accountActive ? 'Desactivar acesso' : 'Reactivar acesso' }}
            </button>
          }
        } @else {
          @if (code(); as c) {
            <div class="code-box" role="status">
              <p>
                Entregue este código ao doente (válido até {{ c.expiresAt | date: 'dd/MM HH:mm' }}):
              </p>
              <p class="code">{{ c.code }}</p>
              <p class="muted">
                Activa a conta em <strong>{{ activationUrl }}</strong> com o código e a data de
                nascimento. Não volta a ser mostrado.
              </p>
              <button class="btn btn-small btn-secondary" type="button" (click)="print()">
                Imprimir
              </button>
            </div>
          } @else {
            <p class="muted">
              Sem conta no portal.
              @if (s.pendingCodeExpiresAt) {
                Há um código entregue, válido até
                {{ s.pendingCodeExpiresAt | date: 'dd/MM HH:mm' }}.
              }
            </p>
            @if (canIssue()) {
              <p class="muted small">
                Confirme a identidade do doente (BI ou documento) antes de gerar o código.
              </p>
              <button
                class="btn btn-small btn-primary"
                type="button"
                [disabled]="busy()"
                (click)="issue()"
              >
                {{ s.pendingCodeExpiresAt ? 'Gerar novo código' : 'Gerar código de activação' }}
              </button>
            }
          }
        }
      } @else if (!error()) {
        <p class="muted" role="status">A carregar…</p>
      }
    </div>
  `,
  styles: `
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
    .code-box {
      border: 2px dashed var(--color-primary);
      border-radius: var(--radius);
      padding: var(--space-3);
    }
    .code {
      font-family: monospace;
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      margin: var(--space-2) 0;
    }
    .small {
      font-size: 0.85rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalAccessCard implements OnInit {
  private readonly portal = inject(PortalService);
  private readonly auth = inject(AuthService);

  readonly patientId = input.required<string>();

  protected readonly activationUrl = `${window.location.origin}/portal/activate`;
  protected readonly canIssue = computed(() => this.auth.hasAnyRole(ACCESS.patientsWrite));
  protected readonly canAdmin = computed(() => this.auth.hasAnyRole(ACCESS.patientsAdmin));
  protected readonly status = signal<PortalStatus | null>(null);
  protected readonly code = signal<{ code: string; expiresAt: string } | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.portal.status(this.patientId()).subscribe({
      next: (s) => this.status.set(s),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected issue(): void {
    this.busy.set(true);
    this.error.set(null);
    this.portal.issueCode(this.patientId()).subscribe({
      next: (c) => {
        this.busy.set(false);
        this.code.set(c);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  protected toggle(active: boolean): void {
    this.busy.set(true);
    this.portal.setActive(this.patientId(), active).subscribe({
      next: (s) => {
        this.busy.set(false);
        this.status.set(s);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  protected print(): void {
    window.print();
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(toApiError(err).message);
  }
}
