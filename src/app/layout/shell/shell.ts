import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ROLE_LABELS } from '../../core/auth/roles';
import { areasFor } from '../../core/navigation/navigation';
import { NotificationBell } from '../../features/notifications/notification-bell/notification-bell';

/** Estrutura das páginas autenticadas: cabeçalho, menu conforme o perfil e conta. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBell],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;
  protected readonly nav = computed(() => [
    { label: 'Início', path: '/home' },
    ...areasFor((roles) => this.auth.hasAnyRole(roles)),
  ]);
  protected readonly roleLabel = computed(
    () =>
      this.user()
        ?.roles.map((r) => ROLE_LABELS[r])
        .join(', ') ?? '',
  );

  logout(): void {
    this.auth.logout().subscribe();
  }
}
