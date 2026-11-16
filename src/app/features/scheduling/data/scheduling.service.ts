import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import {
  Appointment,
  AppointmentRequest,
  AppointmentStatus,
  Block,
  BlockRequest,
  DayAvailability,
  DaySummary,
  RescheduleRequest,
  Schedule,
  ScheduleRequest,
} from './scheduling.model';

@Injectable({ providedIn: 'root' })
export class SchedulingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/scheduling`;

  schedules(doctorId?: string | null): Observable<Schedule[]> {
    let params = new HttpParams();
    if (doctorId) params = params.set('doctorId', doctorId);
    return this.http.get<Schedule[]>(`${this.baseUrl}/schedules`, { params });
  }

  createSchedule(request: ScheduleRequest): Observable<Schedule> {
    return this.http.post<Schedule>(`${this.baseUrl}/schedules`, request);
  }

  deactivateSchedule(id: string): Observable<Schedule> {
    return this.http.patch<Schedule>(
      `${this.baseUrl}/schedules/${encodeURIComponent(id)}/deactivate`,
      null,
    );
  }

  blocks(
    query: { doctorId?: string | null; from?: string; to?: string } = {},
  ): Observable<Block[]> {
    let params = new HttpParams();
    if (query.doctorId) params = params.set('doctorId', query.doctorId);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    return this.http.get<Block[]>(`${this.baseUrl}/blocks`, { params });
  }

  createBlock(request: BlockRequest): Observable<Block> {
    return this.http.post<Block>(`${this.baseUrl}/blocks`, request);
  }

  deleteBlock(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/blocks/${encodeURIComponent(id)}`);
  }

  availability(doctorId: string, date: string): Observable<DayAvailability> {
    const params = new HttpParams().set('doctorId', doctorId).set('date', date);
    return this.http.get<DayAvailability>(`${this.baseUrl}/availability`, { params });
  }

  calendar(month: string, doctorId?: string | null): Observable<DaySummary[]> {
    let params = new HttpParams().set('month', month);
    if (doctorId) params = params.set('doctorId', doctorId);
    return this.http.get<DaySummary[]>(`${this.baseUrl}/calendar`, { params });
  }

  appointments(
    query: {
      from?: string;
      to?: string;
      doctorId?: string | null;
      patientId?: string | null;
      status?: AppointmentStatus | null;
      page?: number;
      size?: number;
    } = {},
  ): Observable<Page<Appointment>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    }
    return this.http.get<Page<Appointment>>(`${this.baseUrl}/appointments`, { params });
  }

  appointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(this.url(id));
  }

  book(request: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/appointments`, request);
  }

  confirm(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.url(id)}/confirm`, null);
  }

  checkIn(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.url(id)}/check-in`, null);
  }

  noShow(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.url(id)}/no-show`, null);
  }

  cancel(id: string, reason: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.url(id)}/cancel`, { reason });
  }

  reschedule(id: string, request: RescheduleRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.url(id)}/reschedule`, request);
  }

  private url(id: string): string {
    return `${this.baseUrl}/appointments/${encodeURIComponent(id)}`;
  }
}
