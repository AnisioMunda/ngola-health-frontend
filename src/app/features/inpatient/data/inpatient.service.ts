import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import {
  Admission,
  AdmissionStatus,
  AdmitRequest,
  Bed,
  BedStatus,
  BedType,
  DischargeCondition,
  Ward,
  WardMap,
  WardRequest,
} from './inpatient.model';

@Injectable({ providedIn: 'root' })
export class InpatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/inpatient`;

  wards(includeInactive = false): Observable<Ward[]> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return this.http.get<Ward[]>(`${this.baseUrl}/wards`, { params });
  }

  map(wardId: string, includeInactive = false): Observable<WardMap> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return this.http.get<WardMap>(`${this.baseUrl}/wards/${encodeURIComponent(wardId)}/map`, {
      params,
    });
  }

  createWard(request: WardRequest): Observable<Ward> {
    return this.http.post<Ward>(`${this.baseUrl}/wards`, request);
  }

  updateWard(id: string, request: WardRequest): Observable<Ward> {
    return this.http.put<Ward>(`${this.baseUrl}/wards/${encodeURIComponent(id)}`, request);
  }

  setWardActive(id: string, active: boolean): Observable<Ward> {
    return this.http.patch<Ward>(
      `${this.baseUrl}/wards/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      null,
    );
  }

  createBed(wardId: string, code: string, type: BedType): Observable<Bed> {
    return this.http.post<Bed>(`${this.baseUrl}/beds`, { wardId, code, type });
  }

  setBedStatus(id: string, status: BedStatus, note: string | null = null): Observable<Bed> {
    return this.http.patch<Bed>(`${this.baseUrl}/beds/${encodeURIComponent(id)}/status`, {
      status,
      note,
    });
  }

  setBedActive(id: string, active: boolean): Observable<Bed> {
    return this.http.patch<Bed>(
      `${this.baseUrl}/beds/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      null,
    );
  }

  admissions(
    query: {
      status?: AdmissionStatus | null;
      wardId?: string | null;
      patientId?: string | null;
      doctorId?: string | null;
      page?: number;
    } = {},
  ): Observable<Page<Admission>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    }
    return this.http.get<Page<Admission>>(`${this.baseUrl}/admissions`, { params });
  }

  admission(id: string): Observable<Admission> {
    return this.http.get<Admission>(this.url(id));
  }

  byEpisode(episodeId: string): Observable<Admission> {
    return this.http.get<Admission>(
      `${this.baseUrl}/admissions/episode/${encodeURIComponent(episodeId)}`,
    );
  }

  admit(request: AdmitRequest): Observable<Admission> {
    return this.http.post<Admission>(`${this.baseUrl}/admissions`, request);
  }

  transfer(id: string, toBedId: string, reason: string): Observable<Admission> {
    return this.http.post<Admission>(`${this.url(id)}/transfer`, { toBedId, reason });
  }

  discharge(
    id: string,
    body: { condition: DischargeCondition; diagnosis: string; summary: string | null },
  ): Observable<Admission> {
    return this.http.post<Admission>(`${this.url(id)}/discharge`, body);
  }

  cancel(id: string, reason: string): Observable<Admission> {
    return this.http.patch<Admission>(`${this.url(id)}/cancel`, { reason });
  }

  assignDoctor(id: string, doctorId: string): Observable<Admission> {
    return this.http.patch<Admission>(`${this.url(id)}/doctor`, { doctorId });
  }

  setExpectedDischarge(id: string, date: string | null): Observable<Admission> {
    return this.http.patch<Admission>(`${this.url(id)}/expected-discharge`, {
      expectedDischargeDate: date,
    });
  }

  private url(id: string): string {
    return `${this.baseUrl}/admissions/${encodeURIComponent(id)}`;
  }
}
