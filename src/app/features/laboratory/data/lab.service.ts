import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import { LabPriority, LabRequest, LabTest, LabTestRequest, ResultInput } from './lab.model';

@Injectable({ providedIn: 'root' })
export class LabService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/lab`;

  tests(query: { search?: string; active?: boolean } = {}): Observable<LabTest[]> {
    let params = new HttpParams();
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.active !== undefined) params = params.set('active', query.active);
    return this.http.get<LabTest[]>(`${this.baseUrl}/tests`, { params });
  }

  createTest(request: LabTestRequest): Observable<LabTest> {
    return this.http.post<LabTest>(`${this.baseUrl}/tests`, request);
  }

  updateTest(id: string, request: LabTestRequest): Observable<LabTest> {
    return this.http.put<LabTest>(`${this.baseUrl}/tests/${encodeURIComponent(id)}`, request);
  }

  setTestActive(id: string, active: boolean): Observable<LabTest> {
    return this.http.patch<LabTest>(
      `${this.baseUrl}/tests/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      null,
    );
  }

  requests(
    query: { open?: boolean; number?: string; page?: number; size?: number } = {},
  ): Observable<Page<LabRequest>> {
    let params = new HttpParams();
    if (query.open) params = params.set('open', true);
    if (query.number?.trim()) params = params.set('number', query.number.trim());
    params = params.set('size', query.size ?? 50);
    return this.http.get<Page<LabRequest>>(`${this.baseUrl}/requests`, { params });
  }

  byEpisode(episodeId: string): Observable<LabRequest[]> {
    return this.http.get<LabRequest[]>(
      `${this.baseUrl}/requests/episode/${encodeURIComponent(episodeId)}`,
    );
  }

  view(id: string): Observable<LabRequest> {
    return this.http.get<LabRequest>(this.req(id));
  }

  create(request: {
    episodeId: string;
    priority: LabPriority;
    clinicalInfo: string | null;
    testIds: string[];
  }): Observable<LabRequest> {
    return this.http.post<LabRequest>(`${this.baseUrl}/requests`, request);
  }

  collect(id: string, notes: string | null): Observable<LabRequest> {
    return this.http.post<LabRequest>(`${this.req(id)}/collect`, { notes });
  }

  start(id: string): Observable<LabRequest> {
    return this.http.post<LabRequest>(`${this.req(id)}/start`, null);
  }

  result(id: string, itemId: string, input: ResultInput): Observable<LabRequest> {
    return this.http.put<LabRequest>(
      `${this.req(id)}/items/${encodeURIComponent(itemId)}/result`,
      input,
    );
  }

  validate(id: string, itemId: string): Observable<LabRequest> {
    return this.http.post<LabRequest>(
      `${this.req(id)}/items/${encodeURIComponent(itemId)}/validate`,
      null,
    );
  }

  amend(
    id: string,
    itemId: string,
    input: ResultInput & { reason: string },
  ): Observable<LabRequest> {
    return this.http.post<LabRequest>(
      `${this.req(id)}/items/${encodeURIComponent(itemId)}/amend`,
      input,
    );
  }

  cancel(id: string, reason: string): Observable<LabRequest> {
    return this.http.patch<LabRequest>(`${this.req(id)}/cancel`, { reason });
  }

  private req(id: string): string {
    return `${this.baseUrl}/requests/${encodeURIComponent(id)}`;
  }
}
