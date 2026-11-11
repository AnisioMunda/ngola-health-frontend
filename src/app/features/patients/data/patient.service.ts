import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import { DuplicateCheck, Patient, PatientRequest, PatientSummary } from './patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/patients`;

  search(
    query: { search?: string; active?: boolean; page?: number; size?: number } = {},
  ): Observable<Page<PatientSummary>> {
    let params = new HttpParams();
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.active !== undefined) params = params.set('active', query.active);
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    return this.http.get<Page<PatientSummary>>(this.baseUrl, { params });
  }

  /** Abre a ficha (fica registado na auditoria). */
  view(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  possibleDuplicates(check: DuplicateCheck): Observable<PatientSummary[]> {
    return this.http.post<PatientSummary[]>(`${this.baseUrl}/possible-duplicates`, check);
  }

  create(request: PatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.baseUrl, request);
  }

  update(id: string, request: PatientRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${encodeURIComponent(id)}`, request);
  }

  setActive(id: string, active: boolean): Observable<Patient> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.patch<Patient>(`${this.baseUrl}/${encodeURIComponent(id)}/${action}`, null);
  }
}
