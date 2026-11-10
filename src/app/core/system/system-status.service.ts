import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../environments/environment';

export type BackendStatus = 'UP' | 'DOWN';

/** Verifica se o backend está disponível (endpoint público /actuator/health). */
@Injectable({ providedIn: 'root' })
export class SystemStatusService {
  private readonly http = inject(HttpClient);

  checkBackend(): Observable<BackendStatus> {
    return this.http.get<{ status: string }>(`${environment.apiUrl}/actuator/health`).pipe(
      map((res) => (res.status === 'UP' ? 'UP' : 'DOWN')),
      catchError(() => of<BackendStatus>('DOWN')),
    );
  }
}
