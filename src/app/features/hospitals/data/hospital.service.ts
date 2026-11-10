import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import { Hospital, HospitalRequest, HospitalSearch } from './hospital.model';

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/hospitals`;

  /** Hospitais activos, para listas de selecção (qualquer utilizador autenticado). */
  findActive(): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(this.baseUrl);
  }

  /** Pesquisa paginada de todos os hospitais (só super-administrador). */
  search(query: HospitalSearch = {}): Observable<Page<Hospital>> {
    let params = new HttpParams();
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.active !== undefined) params = params.set('active', query.active);
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    return this.http.get<Page<Hospital>>(`${this.baseUrl}/management`, { params });
  }

  findById(id: string): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  create(request: HospitalRequest): Observable<Hospital> {
    return this.http.post<Hospital>(this.baseUrl, request);
  }

  update(id: string, request: HospitalRequest): Observable<Hospital> {
    return this.http.put<Hospital>(`${this.baseUrl}/${encodeURIComponent(id)}`, request);
  }

  setActive(id: string, active: boolean): Observable<Hospital> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.patch<Hospital>(`${this.baseUrl}/${encodeURIComponent(id)}/${action}`, null);
  }
}
