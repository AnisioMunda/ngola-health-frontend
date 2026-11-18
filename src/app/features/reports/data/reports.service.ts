import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Dashboard, FinancialReport, OccupancyReport } from './reports.model';

export interface Period {
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  dashboard(period: Period): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.baseUrl}/dashboard`, { params: params(period) });
  }

  occupancy(period: Period): Observable<OccupancyReport> {
    return this.http.get<OccupancyReport>(`${this.baseUrl}/occupancy`, { params: params(period) });
  }

  financial(period: Period): Observable<FinancialReport> {
    return this.http.get<FinancialReport>(`${this.baseUrl}/financial`, { params: params(period) });
  }

  /** CSV com o token de sessão (o interceptor junta-o); devolve o ficheiro para descarregar. */
  csv(report: 'occupancy' | 'financial', period: Period): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${report}.csv`, {
      params: params(period),
      responseType: 'blob',
    });
  }
}

function params(period: Period): HttpParams {
  return new HttpParams().set('from', period.from).set('to', period.to);
}

/** Descarrega um ficheiro recebido como Blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
