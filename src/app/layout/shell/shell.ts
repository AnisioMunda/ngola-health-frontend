import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ACCESS, ROLE_LABELS, Role } from '../../core/auth/roles';

interface NavItem {
  label: string;
  path: string;
  roles?: readonly Role[];
}

const NAV: NavItem[] = [
  { label: 'Início', path: '/home' },
  { label: 'Pacientes', path: '/patients', roles: ACCESS.patientsRead },
  { label: 'Triagem', path: '/triage', roles: ACCESS.patientsRead },
  { label: 'Episódios', path: '/episodes', roles: ACCESS.patientsRead },
  { label: 'Farmácia', path: '/pharmacy', roles: ACCESS.pharmacyRead },
  { label: 'Hospitais', path: '/hospitals', roles: ACCESS.hospitals },
  { label: 'Utilizadores', path: '/users', roles: ACCESS.usersRead },
  { label: 'Auditoria', path: '/audit', roles: ACCESS.audit },
];

/** Estrutura das páginas autenticadas: cabeçalho, menu conforme o perfil e conta. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;
  protected readonly nav = computed(() =>
    NAV.filter((item) => !item.roles || this.auth.hasAnyRole(item.roles)),
  );
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
