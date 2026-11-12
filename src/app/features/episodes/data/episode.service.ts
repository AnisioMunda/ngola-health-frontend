import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import {
  Doctor,
  Episode,
  EpisodeSearch,
  EpisodeSummary,
  EpisodeType,
  Vitals,
} from './episode.model';

@Injectable({ providedIn: 'root' })
export class EpisodeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/episodes`;

  search(query: EpisodeSearch = {}): Observable<Page<EpisodeSummary>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const item of value) params = params.append(key, item);
      } else {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<EpisodeSummary>>(this.baseUrl, { params });
  }

  view(id: string): Observable<Episode> {
    return this.http.get<Episode>(this.url(id));
  }

  create(request: {
    patientId: string;
    type: EpisodeType;
    doctorId: string | null;
    scheduledAt: string | null;
    reason: string;
  }): Observable<Episode> {
    return this.http.post<Episode>(this.baseUrl, request);
  }

  assignDoctor(id: string, doctorId: string | null): Observable<Episode> {
    return this.http.put<Episode>(`${this.url(id)}/doctor`, { doctorId });
  }

  start(id: string): Observable<Episode> {
    return this.http.patch<Episode>(`${this.url(id)}/start`, null);
  }

  recordVitals(id: string, vitals: Vitals, version: number): Observable<Episode> {
    return this.http.put<Episode>(`${this.url(id)}/vitals`, { ...vitals, version });
  }

  recordClinicalNotes(
    id: string,
    notes: { symptoms: string | null; diagnosis: string | null; clinicalNotes: string | null },
    version: number,
  ): Observable<Episode> {
    return this.http.put<Episode>(`${this.url(id)}/clinical-notes`, { ...notes, version });
  }

  complete(id: string): Observable<Episode> {
    return this.http.patch<Episode>(`${this.url(id)}/complete`, null);
  }

  cancel(id: string, reason: string): Observable<Episode> {
    return this.http.patch<Episode>(`${this.url(id)}/cancel`, { reason });
  }

  doctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${environment.apiUrl}/staff/doctors`);
  }

  private url(id: string): string {
    return `${this.baseUrl}/${encodeURIComponent(id)}`;
  }
}
