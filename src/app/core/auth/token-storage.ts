import { Injectable } from '@angular/core';

const REFRESH_KEY = 'ngolahealth.refreshToken';

/**
 * Guarda o refresh token entre recargas da página. O token de acesso fica só em memória.
 * O acesso ao localStorage pode falhar (modo privado, bloqueios): nesse caso a sessão dura
 * apenas enquanto a página estiver aberta.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  }

  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_KEY, token);
    } catch {
      /* indisponível */
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* indisponível */
    }
  }
}
