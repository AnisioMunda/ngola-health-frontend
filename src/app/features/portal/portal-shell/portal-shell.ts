import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { NotificationBell } from '../../notifications/notification-bell/notification-bell';

/** Estrutura do portal do paciente: mais simples que a do pessoal, pensada também para telemóvel. */
@Component({
  selector: 'app-portal-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBell],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/portal">Ngola Health <small>· O meu portal</small></a>
      <nav aria-label="Portal do paciente">
        <a
          routerLink="/portal"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          >Início</a
        >
        <a routerLink="appointments" routerLinkActive="active">Consultas</a>
        <a routerLink="results" routerLinkActive="active">Resultados</a>
        <a routerLink="prescriptions" routerLinkActive="active">Receitas</a>
        <a routerLink="invoices" routerLinkActive="active">Facturas</a>
      </nav>
      <div class="account">
        <span class="who">{{ user()?.fullName }}</span>
        <app-notification-bell />
        <a class="btn btn-small btn-secondary" routerLink="/change-password">Senha</a>
        <button class="btn btn-small btn-secondary" type="button" (click)="logout()">Sair</button>
      </div>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    .topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3) var(--space-5);
      padding: var(--space-3) var(--space-5);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }
    .brand {
      font-weight: 700;
      color: var(--color-primary);
      text-decoration: none;
    }
    .brand small {
      font-weight: 400;
      color: var(--color-muted);
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      flex: 1;
    }
    nav a {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius);
      color: var(--color-text);
      text-decoration: none;
    }
    nav a.active {
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-weight: 600;
    }
    .account {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .who {
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalShell {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;

  protected logout(): void {
    this.auth.logout().subscribe();
  }
}
