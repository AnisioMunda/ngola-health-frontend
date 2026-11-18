import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  PortalAppointment,
  PortalInvoice,
  PortalLabRequest,
  PortalPrescription,
  PortalProfile,
  PortalStatus,
} from './portal.model';

/** API do portal (conta do doente) e gestão do acesso pelo pessoal. */
@Injectable({ providedIn: 'root' })
export class PortalService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  activate(body: {
    code: string;
    birthDate: string;
    username: string;
    email: string;
    password: string;
  }): Observable<void> {
    return this.http.post<void>(`${this.api}/portal/activate`, body);
  }

  me(): Observable<PortalProfile> {
    return this.http.get<PortalProfile>(`${this.api}/portal/me`);
  }

  appointments(): Observable<PortalAppointment[]> {
    return this.http.get<PortalAppointment[]>(`${this.api}/portal/appointments`);
  }

  cancelAppointment(id: string, reason: string): Observable<void> {
    return this.http.patch<void>(
      `${this.api}/portal/appointments/${encodeURIComponent(id)}/cancel`,
      {
        reason,
      },
    );
  }

  labResults(): Observable<PortalLabRequest[]> {
    return this.http.get<PortalLabRequest[]>(`${this.api}/portal/lab-results`);
  }

  prescriptions(): Observable<PortalPrescription[]> {
    return this.http.get<PortalPrescription[]>(`${this.api}/portal/prescriptions`);
  }

  invoices(): Observable<PortalInvoice[]> {
    return this.http.get<PortalInvoice[]>(`${this.api}/portal/invoices`);
  }

  // ---------- Pessoal ----------

  status(patientId: string): Observable<PortalStatus> {
    return this.http.get<PortalStatus>(
      `${this.api}/patients/${encodeURIComponent(patientId)}/portal`,
    );
  }

  issueCode(patientId: string): Observable<{ code: string; expiresAt: string }> {
    return this.http.post<{ code: string; expiresAt: string }>(
      `${this.api}/patients/${encodeURIComponent(patientId)}/portal/activation-code`,
      null,
    );
  }

  setActive(patientId: string, active: boolean): Observable<PortalStatus> {
    return this.http.patch<PortalStatus>(
      `${this.api}/patients/${encodeURIComponent(patientId)}/portal/${active ? 'activate' : 'deactivate'}`,
      null,
    );
  }
}
