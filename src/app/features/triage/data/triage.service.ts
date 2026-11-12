import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CreateTriage, Triage, TriagePriority, TriageStats } from './triage.model';

@Injectable({ providedIn: 'root' })
export class TriageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/triage`;

  queue(): Observable<Triage[]> {
    return this.http.get<Triage[]>(`${this.baseUrl}/queue`);
  }

  stats(): Observable<TriageStats> {
    return this.http.get<TriageStats>(`${this.baseUrl}/stats`);
  }

  day(day?: string): Observable<Triage[]> {
    return this.http.get<Triage[]>(this.baseUrl, { params: day ? { day } : {} });
  }

  view(id: string): Observable<Triage> {
    return this.http.get<Triage>(this.url(id));
  }

  create(request: CreateTriage): Observable<Triage> {
    return this.http.post<Triage>(this.baseUrl, request);
  }

  changePriority(id: string, priority: TriagePriority, reason: string): Observable<Triage> {
    return this.http.patch<Triage>(`${this.url(id)}/priority`, { priority, reason });
  }

  identify(id: string, patientId: string): Observable<Triage> {
    return this.http.patch<Triage>(`${this.url(id)}/patient`, { patientId });
  }

  call(id: string): Observable<Triage> {
    return this.http.patch<Triage>(`${this.url(id)}/call`, null);
  }

  openEpisode(id: string, doctorId: string | null): Observable<Triage> {
    return this.http.post<Triage>(`${this.url(id)}/episode`, { doctorId });
  }

  complete(id: string): Observable<Triage> {
    return this.http.patch<Triage>(`${this.url(id)}/complete`, null);
  }

  left(id: string): Observable<Triage> {
    return this.http.patch<Triage>(`${this.url(id)}/left`, null);
  }

  private url(id: string): string {
    return `${this.baseUrl}/${encodeURIComponent(id)}`;
  }
}
