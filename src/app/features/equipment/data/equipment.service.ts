import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import {
  Equipment,
  EquipmentCategory,
  EquipmentOverview,
  EquipmentRequest,
  EquipmentStatus,
  EquipmentSummary,
  Fault,
  MaintenanceResult,
  MaintenanceType,
} from './equipment.model';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/equipment`;

  search(
    query: {
      status?: EquipmentStatus | null;
      category?: EquipmentCategory | null;
      search?: string;
      includeRetired?: boolean;
      page?: number;
    } = {},
  ): Observable<Page<EquipmentSummary>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    }
    return this.http.get<Page<EquipmentSummary>>(this.baseUrl, { params });
  }

  overview(): Observable<EquipmentOverview> {
    return this.http.get<EquipmentOverview>(`${this.baseUrl}/overview`);
  }

  due(days = 30): Observable<EquipmentSummary[]> {
    return this.http.get<EquipmentSummary[]>(`${this.baseUrl}/due`, {
      params: new HttpParams().set('days', days),
    });
  }

  openFaults(): Observable<Fault[]> {
    return this.http.get<Fault[]>(`${this.baseUrl}/faults`);
  }

  view(id: string): Observable<Equipment> {
    return this.http.get<Equipment>(this.url(id));
  }

  create(request: EquipmentRequest): Observable<Equipment> {
    return this.http.post<Equipment>(this.baseUrl, request);
  }

  update(id: string, request: EquipmentRequest): Observable<Equipment> {
    return this.http.put<Equipment>(this.url(id), request);
  }

  reportFault(id: string, description: string, outOfService: boolean): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.url(id)}/faults`, { description, outOfService });
  }

  dismissFault(faultId: string, reason: string): Observable<Equipment> {
    return this.http.patch<Equipment>(
      `${this.baseUrl}/faults/${encodeURIComponent(faultId)}/dismiss`,
      { reason },
    );
  }

  sendToMaintenance(id: string): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.url(id)}/send-to-maintenance`, null);
  }

  recordMaintenance(
    id: string,
    body: {
      type: MaintenanceType;
      performedOn: string;
      performedBy: string;
      description: string;
      partsReplaced: string | null;
      cost: number | null;
      result: MaintenanceResult;
      faultId: string | null;
    },
  ): Observable<Equipment> {
    return this.http.post<Equipment>(`${this.url(id)}/maintenance`, body);
  }

  retire(id: string, reason: string): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.url(id)}/retire`, { reason });
  }

  private url(id: string): string {
    return `${this.baseUrl}/${encodeURIComponent(id)}`;
  }
}
