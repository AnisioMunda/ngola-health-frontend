import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import {
  Attendance,
  DailyPresence,
  Leave,
  LeaveStatus,
  LeaveType,
  Overview,
  Shift,
  ShiftRequest,
  StaffMember,
} from './hr.model';

@Injectable({ providedIn: 'root' })
export class HrService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/hr`;

  staff(): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>(`${this.baseUrl}/staff`);
  }

  overview(): Observable<Overview> {
    return this.http.get<Overview>(`${this.baseUrl}/overview`);
  }

  shifts(from: string, to: string, userId?: string | null): Observable<Shift[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (userId) params = params.set('userId', userId);
    return this.http.get<Shift[]>(`${this.baseUrl}/shifts`, { params });
  }

  myShifts(from: string, to: string): Observable<Shift[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<Shift[]>(`${this.baseUrl}/shifts/mine`, { params });
  }

  createShift(request: ShiftRequest): Observable<Shift> {
    return this.http.post<Shift>(`${this.baseUrl}/shifts`, request);
  }

  cancelShift(id: string, reason: string): Observable<Shift> {
    return this.http.patch<Shift>(`${this.baseUrl}/shifts/${encodeURIComponent(id)}/cancel`, {
      reason,
    });
  }

  copyWeek(fromWeek: string, toWeek: string): Observable<{ created: number; skipped: string[] }> {
    return this.http.post<{ created: number; skipped: string[] }>(
      `${this.baseUrl}/shifts/copy-week`,
      { fromWeek, toWeek },
    );
  }

  requestLeave(body: {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason: string | null;
  }): Observable<Leave> {
    return this.http.post<Leave>(`${this.baseUrl}/leaves`, body);
  }

  myLeaves(page = 0): Observable<Page<Leave>> {
    return this.http.get<Page<Leave>>(`${this.baseUrl}/leaves/mine`, {
      params: new HttpParams().set('page', page),
    });
  }

  leaves(query: { status?: LeaveStatus | null; page?: number } = {}): Observable<Page<Leave>> {
    let params = new HttpParams().set('page', query.page ?? 0);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<Page<Leave>>(`${this.baseUrl}/leaves`, { params });
  }

  decide(
    id: string,
    body: { approve: boolean; note: string | null; cancelConflictingShifts: boolean },
  ): Observable<Leave> {
    return this.http.post<Leave>(`${this.baseUrl}/leaves/${encodeURIComponent(id)}/decision`, body);
  }

  cancelLeave(id: string): Observable<Leave> {
    return this.http.patch<Leave>(`${this.baseUrl}/leaves/${encodeURIComponent(id)}/cancel`, null);
  }

  /** Entrada em aberto (null se não houver: o backend responde 204). */
  current(): Observable<Attendance | null> {
    return this.http.get<Attendance | null>(`${this.baseUrl}/attendance/current`);
  }

  clockIn(): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.baseUrl}/attendance/clock-in`, null);
  }

  clockOut(): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.baseUrl}/attendance/clock-out`, null);
  }

  myAttendance(from: string, to: string): Observable<Attendance[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<Attendance[]>(`${this.baseUrl}/attendance/mine`, { params });
  }

  attendance(from: string, to: string, userId?: string | null): Observable<Attendance[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (userId) params = params.set('userId', userId);
    return this.http.get<Attendance[]>(`${this.baseUrl}/attendance`, { params });
  }

  correct(
    id: string,
    body: { clockIn: string; clockOut: string | null; reason: string },
  ): Observable<Attendance> {
    return this.http.patch<Attendance>(
      `${this.baseUrl}/attendance/${encodeURIComponent(id)}`,
      body,
    );
  }

  daily(date?: string): Observable<DailyPresence[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<DailyPresence[]>(`${this.baseUrl}/attendance/daily`, { params });
  }
}
