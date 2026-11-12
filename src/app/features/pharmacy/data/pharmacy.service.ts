import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import {
  AdjustmentKind,
  Batch,
  DispenseResult,
  Medication,
  MedicationRequest,
  Movement,
  StockAlerts,
} from './pharmacy.model';

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/pharmacy`;

  search(
    query: { search?: string; active?: boolean; page?: number; size?: number } = {},
  ): Observable<Page<Medication>> {
    let params = new HttpParams();
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.active !== undefined) params = params.set('active', query.active);
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    return this.http.get<Page<Medication>>(`${this.baseUrl}/medications`, { params });
  }

  medication(id: string): Observable<Medication> {
    return this.http.get<Medication>(`${this.baseUrl}/medications/${encodeURIComponent(id)}`);
  }

  create(request: MedicationRequest): Observable<Medication> {
    return this.http.post<Medication>(`${this.baseUrl}/medications`, request);
  }

  update(id: string, request: MedicationRequest): Observable<Medication> {
    return this.http.put<Medication>(
      `${this.baseUrl}/medications/${encodeURIComponent(id)}`,
      request,
    );
  }

  setActive(id: string, active: boolean): Observable<Medication> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.patch<Medication>(
      `${this.baseUrl}/medications/${encodeURIComponent(id)}/${action}`,
      null,
    );
  }

  batches(medicationId: string): Observable<Batch[]> {
    return this.http.get<Batch[]>(
      `${this.baseUrl}/medications/${encodeURIComponent(medicationId)}/batches`,
    );
  }

  movements(medicationId: string, page = 0, size = 50): Observable<Page<Movement>> {
    return this.http.get<Page<Movement>>(
      `${this.baseUrl}/medications/${encodeURIComponent(medicationId)}/movements`,
      { params: { page, size } },
    );
  }

  receive(request: {
    medicationId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number | null;
    supplier: string | null;
  }): Observable<Batch> {
    return this.http.post<Batch>(`${this.baseUrl}/stock/receive`, request);
  }

  adjust(
    batchId: string,
    kind: AdjustmentKind,
    quantity: number,
    reason: string,
  ): Observable<Batch> {
    return this.http.post<Batch>(`${this.baseUrl}/batches/${encodeURIComponent(batchId)}/adjust`, {
      kind,
      quantity,
      reason,
    });
  }

  writeOffExpired(batchId: string): Observable<Batch> {
    return this.http.post<Batch>(
      `${this.baseUrl}/batches/${encodeURIComponent(batchId)}/write-off-expired`,
      null,
    );
  }

  dispense(request: {
    medicationId: string;
    quantity: number;
    reason: string | null;
  }): Observable<DispenseResult> {
    return this.http.post<DispenseResult>(`${this.baseUrl}/dispense`, request);
  }

  alerts(days = 90): Observable<StockAlerts> {
    return this.http.get<StockAlerts>(`${this.baseUrl}/alerts`, { params: { days } });
  }
}
