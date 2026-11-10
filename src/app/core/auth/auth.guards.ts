import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { Role } from './roles';

/** Exige sessão; caso contrário vai para o login e volta depois à rota pedida. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Com troca de senha pendente, só a página de troca de senha está acessível. */
export const passwordChangedGuard: CanActivateFn = (_route, state) => {
  const user = inject(AuthService).user();
  return user?.mustChangePassword
    ? inject(Router).createUrlTree(['/change-password'], { queryParams: { returnUrl: state.url } })
    : true;
};

/** Perfis permitidos em {@code data.roles}; sem permissão volta ao início. */
export const roleGuard: CanActivateFn = (route) => {
  const roles = (route.data['roles'] ?? []) as Role[];
  return inject(AuthService).hasAnyRole(roles) ? true : inject(Router).createUrlTree(['/']);
};

/** O ecrã de login não faz sentido com sessão iniciada. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).isAuthenticated() ? inject(Router).createUrlTree(['/']) : true;

/** Aceita apenas caminhos internos como destino depois do login (evita redireccionamentos abertos). */
export function safeReturnUrl(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login')
    ? value
    : '/';
}
