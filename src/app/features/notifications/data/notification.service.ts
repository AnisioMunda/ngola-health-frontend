import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import { AppNotification, UnreadCount } from './notification.model';

/** Notificações do utilizador autenticado e o contador partilhado pelo sino e pela página. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  private readonly unreadCount = signal(0);
  readonly unread = this.unreadCount.asReadonly();

  list(
    query: { unreadOnly?: boolean; page?: number; size?: number } = {},
  ): Observable<Page<AppNotification>> {
    let params = new HttpParams().set('page', query.page ?? 0).set('size', query.size ?? 20);
    if (query.unreadOnly) params = params.set('unreadOnly', true);
    return this.http.get<Page<AppNotification>>(this.baseUrl, { params });
  }

  /** Actualiza o contador; uma falha (ex.: rede) mantém o último valor conhecido. */
  refreshCount(): Observable<UnreadCount> {
    return this.http
      .get<UnreadCount>(`${this.baseUrl}/unread-count`)
      .pipe(tap((c) => this.unreadCount.set(c.count)));
  }

  markRead(n: AppNotification): Observable<AppNotification> {
    return this.http
      .patch<AppNotification>(`${this.baseUrl}/${encodeURIComponent(n.id)}/read`, null)
      .pipe(
        tap(() => {
          if (!n.readAt) this.unreadCount.update((c) => Math.max(0, c - 1));
        }),
      );
  }

  markAllRead(): Observable<UnreadCount> {
    return this.http
      .patch<UnreadCount>(`${this.baseUrl}/read-all`, null)
      .pipe(tap((c) => this.unreadCount.set(c.count)));
  }
}
