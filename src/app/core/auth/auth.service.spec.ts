import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenResponse } from './auth.models';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

function tokens(access: string, refresh: string, mustChange = false): TokenResponse {
  return {
    accessToken: access,
    refreshToken: refresh,
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      id: 'u1',
      username: 'ana',
      fullName: 'Ana',
      email: 'ana@x.ao',
      roles: ['ADMIN'],
      hospitalId: 'h1',
      hospitalName: 'HCL',
      mustChangePassword: mustChange,
    },
  };
}

describe('AuthService + authInterceptor', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let storage: Record<string, string | null>;
  let router: Router;

  beforeEach(() => {
    storage = { refresh: null };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: TokenStorage,
          useValue: {
            getRefreshToken: () => storage['refresh'],
            setRefreshToken: (t: string) => (storage['refresh'] = t),
            clear: () => (storage['refresh'] = null),
          },
        },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  function login() {
    auth.login('ana', 'Senha-2026x').subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(tokens('A1', 'R1'));
  }

  it('guarda o utilizador e o refresh token após o login', () => {
    login();
    expect(auth.user()?.username).toBe('ana');
    expect(auth.getAccessToken()).toBe('A1');
    expect(storage['refresh']).toBe('R1');
    expect(auth.hasAnyRole(['ADMIN', 'MANAGER'])).toBe(true);
    expect(auth.hasAnyRole(['SUPER_ADMIN'])).toBe(false);
  });

  it('junta o token de acesso aos pedidos da API', () => {
    login();
    TestBed.inject(HttpTestingControllerClient).get('/api/users').subscribe();
    expect(http.expectOne('/api/users').request.headers.get('Authorization')).toBe('Bearer A1');
  });

  it('num 401 renova uma única vez para pedidos simultâneos e repete-os', () => {
    login();
    const client = TestBed.inject(HttpTestingControllerClient);
    const results: unknown[] = [];
    client.get('/api/users').subscribe((r) => results.push(r));
    client.get('/api/hospitals').subscribe((r) => results.push(r));

    http.expectOne('/api/users').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/hospitals').flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = http.expectOne('/api/auth/refresh');
    expect(refresh.request.body).toEqual({ refreshToken: 'R1' });
    refresh.flush(tokens('A2', 'R2'));

    const retryUsers = http.expectOne('/api/users');
    const retryHospitals = http.expectOne('/api/hospitals');
    expect(retryUsers.request.headers.get('Authorization')).toBe('Bearer A2');
    retryUsers.flush(['u']);
    retryHospitals.flush(['h']);
    expect(results).toEqual([['u'], ['h']]);
    expect(storage['refresh']).toBe('R2');
  });

  it('se a renovação falhar, termina a sessão e volta ao login', () => {
    login();
    let failed = false;
    TestBed.inject(HttpTestingControllerClient)
      .get('/api/users')
      .subscribe({ error: () => (failed = true) });

    http.expectOne('/api/users').flush(null, { status: 401, statusText: 'Unauthorized' });
    http
      .expectOne('/api/auth/refresh')
      .flush({ code: 'INVALID_REFRESH_TOKEN' }, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(auth.user()).toBeNull();
    expect(storage['refresh']).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('restaura a sessão ao arrancar com o refresh token guardado', async () => {
    storage['refresh'] = 'R9';
    const restored = auth.restoreSession();
    http.expectOne('/api/auth/refresh').flush(tokens('A9', 'R10'));
    await restored;
    expect(auth.isAuthenticated()).toBe(true);
    expect(storage['refresh']).toBe('R10');
  });

  it('logout limpa a sessão e revoga o refresh token no servidor', () => {
    login();
    auth.logout().subscribe();
    const req = http.expectOne('/api/auth/logout');
    expect(req.request.body).toEqual({ refreshToken: 'R1' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(null);
    expect(auth.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('troca de senha obrigatória redirecciona para a página de troca', () => {
    login();
    TestBed.inject(HttpTestingControllerClient)
      .get('/api/users')
      .subscribe({ error: () => {} });
    http
      .expectOne('/api/users')
      .flush({ code: 'PASSWORD_CHANGE_REQUIRED' }, { status: 403, statusText: 'Forbidden' });
    expect(router.navigate).toHaveBeenCalledWith(['/change-password']);
  });
});

/** HttpClient com o interceptor configurado no TestBed. */
import { HttpClient as HttpTestingControllerClient } from '@angular/common/http';
