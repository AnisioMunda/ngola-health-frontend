import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  firstValueFrom,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthUser, TokenResponse } from './auth.models';
import { Role } from './roles';
import { TokenStorage } from './token-storage';

const AUTH_URL = `${environment.apiUrl}/auth`;

/** Estado da sessão: utilizador autenticado, token de acesso (em memória) e renovação. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorage);

  private readonly currentUser = signal<AuthUser | null>(null);
  private accessToken: string | null = null;
  private refreshing: Observable<string> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  getAccessToken(): string | null {
    return this.accessToken;
  }

  hasRefreshToken(): boolean {
    return this.storage.getRefreshToken() !== null;
  }

  hasAnyRole(roles: readonly Role[]): boolean {
    const user = this.currentUser();
    return !!user && user.roles.some((role) => roles.includes(role));
  }

  login(login: string, password: string): Observable<AuthUser> {
    return this.http
      .post<TokenResponse>(`${AUTH_URL}/login`, { login, password })
      .pipe(map((response) => this.store(response)));
  }

  /** Ao arrancar a aplicação: recupera a sessão a partir do refresh token guardado. */
  restoreSession(): Promise<void> {
    if (!this.hasRefreshToken()) return Promise.resolve();
    return firstValueFrom(
      this.refresh().pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
      ),
    );
  }

  /**
   * Renova o token de acesso. Pedidos simultâneos partilham a mesma renovação. Se outro
   * separador renovou entretanto (o token guardado mudou), tenta uma vez com o novo.
   */
  refresh(): Observable<string> {
    if (!this.refreshing) {
      const used = this.storage.getRefreshToken();
      this.refreshing = this.requestRefresh(used).pipe(
        catchError((error: unknown) => {
          const latest = this.storage.getRefreshToken();
          if (latest && latest !== used) return this.requestRefresh(latest);
          return throwError(() => error);
        }),
        tap({ error: () => this.clear() }),
        finalize(() => (this.refreshing = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshing;
  }

  logout(): Observable<void> {
    const refreshToken = this.storage.getRefreshToken();
    this.clear();
    return this.http.post<void>(`${AUTH_URL}/logout`, { refreshToken }).pipe(
      catchError(() => of(undefined)),
      tap(() => void this.router.navigate(['/login'])),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthUser> {
    return this.http
      .post<void>(`${AUTH_URL}/change-password`, { currentPassword, newPassword })
      .pipe(
        switchMap(() => this.http.get<AuthUser>(`${AUTH_URL}/me`)),
        tap((user) => this.currentUser.set(user)),
      );
  }

  /** Sessão perdida (refresh recusado): limpa o estado e volta ao login, guardando a rota. */
  expireSession(): void {
    this.clear();
    const returnUrl = this.router.url;
    void this.router.navigate(['/login'], {
      queryParams: { reason: 'expired', ...(returnUrl.startsWith('/login') ? {} : { returnUrl }) },
    });
  }

  private requestRefresh(refreshToken: string | null): Observable<string> {
    if (!refreshToken) return throwError(() => new Error('Sem sessão'));
    return this.http
      .post<TokenResponse>(`${AUTH_URL}/refresh`, { refreshToken })
      .pipe(map((response) => (this.store(response), response.accessToken)));
  }

  private store(response: TokenResponse): AuthUser {
    this.accessToken = response.accessToken;
    this.storage.setRefreshToken(response.refreshToken);
    this.currentUser.set(response.user);
    return response.user;
  }

  private clear(): void {
    this.accessToken = null;
    this.storage.clear();
    this.currentUser.set(null);
  }
}
