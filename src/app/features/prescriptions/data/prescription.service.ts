import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import { NewItem, Prescription } from './prescription.model';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/prescriptions`;

  search(
    query: {
      open?: boolean;
      patientId?: string;
      number?: string;
      page?: number;
      size?: number;
    } = {},
  ): Observable<Page<Prescription>> {
    let params = new HttpParams();
    if (query.open) params = params.set('open', true);
    if (query.patientId) params = params.set('patientId', query.patientId);
    if (query.number?.trim()) params = params.set('number', query.number.trim());
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    return this.http.get<Page<Prescription>>(this.baseUrl, { params });
  }

  byEpisode(episodeId: string): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(
      `${this.baseUrl}/episode/${encodeURIComponent(episodeId)}`,
    );
  }

  view(id: string): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  create(request: {
    episodeId: string;
    validityDays: number | null;
    notes: string | null;
    items: NewItem[];
  }): Observable<Prescription> {
    return this.http.post<Prescription>(this.baseUrl, request);
  }

  dispense(id: string, lines: { itemId: string; quantity: number }[]): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.baseUrl}/${encodeURIComponent(id)}/dispense`, {
      lines,
    });
  }

  cancel(id: string, reason: string): Observable<Prescription> {
    return this.http.patch<Prescription>(`${this.baseUrl}/${encodeURIComponent(id)}/cancel`, {
      reason,
    });
  }
}
