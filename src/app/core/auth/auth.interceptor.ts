import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Endpoints que não levam token (um token expirado faria o backend recusá-los). */
const PUBLIC_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout', '/actuator/health'];

function isApi(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

function isPublic(url: string): boolean {
  return PUBLIC_PATHS.some((path) => url.startsWith(environment.apiUrl + path));
}

function withToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Junta o token de acesso aos pedidos da API. Num 401, renova a sessão uma vez e repete o
 * pedido; se a renovação falhar, termina a sessão e volta ao login (guardando a rota).
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApi(request.url) || isPublic(request.url)) return next(request);

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getAccessToken();

  return next(token ? withToken(request, token) : request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);

      if (error.status === 401 && auth.hasRefreshToken()) {
        return auth.refresh().pipe(
          catchError(() => {
            auth.expireSession();
            return throwError(() => error);
          }),
          switchMap((fresh) => next(withToken(request, fresh))),
        );
      }
      if (error.status === 401 && auth.isAuthenticated()) {
        auth.expireSession();
      }
      if (error.status === 403 && error.error?.code === 'PASSWORD_CHANGE_REQUIRED') {
        void router.navigate(['/change-password']);
      }
      return throwError(() => error);
    }),
  );
};
