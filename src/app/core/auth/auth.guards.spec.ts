import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthUser } from './auth.models';
import { authGuard, passwordChangedGuard, roleGuard, safeReturnUrl } from './auth.guards';
import { AuthService } from './auth.service';
import { Role } from './roles';

describe('guards de autenticação', () => {
  let user: AuthUser | null;

  beforeEach(() => {
    user = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: () => user,
            isAuthenticated: () => user !== null,
            hasAnyRole: (roles: Role[]) => !!user && user.roles.some((r) => roles.includes(r)),
          },
        },
      ],
    });
  });

  function run(guard: typeof authGuard, data: Record<string, unknown> = {}, url = '/users') {
    const route = { data } as unknown as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => guard(route, state));
  }

  function asUrl(result: unknown): string {
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  function signIn(roles: Role[], mustChangePassword = false) {
    user = {
      id: '1',
      username: 'x',
      fullName: 'X',
      email: 'x@x.ao',
      roles,
      hospitalId: 'h',
      hospitalName: 'H',
      mustChangePassword,
    };
  }

  it('sem sessão vai para o login guardando a rota', () => {
    expect(asUrl(run(authGuard))).toBe('/login?returnUrl=%2Fusers');
  });

  it('com troca de senha pendente só permite a página de troca', () => {
    signIn(['ADMIN'], true);
    expect(run(authGuard)).toBe(true);
    expect(asUrl(run(passwordChangedGuard))).toBe('/change-password?returnUrl=%2Fusers');
  });

  it('controla o acesso por perfil', () => {
    signIn(['DOCTOR']);
    expect(asUrl(run(roleGuard, { roles: ['SUPER_ADMIN', 'ADMIN'] }))).toBe('/');
    signIn(['ADMIN']);
    expect(run(roleGuard, { roles: ['SUPER_ADMIN', 'ADMIN'] })).toBe(true);
  });

  it('só aceita destinos internos depois do login', () => {
    expect(safeReturnUrl('/users?page=2')).toBe('/users?page=2');
    expect(safeReturnUrl('https://malicioso.example')).toBe('/');
    expect(safeReturnUrl('//malicioso.example')).toBe('/');
    expect(safeReturnUrl('/login')).toBe('/');
    expect(safeReturnUrl(undefined)).toBe('/');
  });
});
