import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/http/page';
import {
  CashSummary,
  DocumentType,
  Invoice,
  InvoiceRequest,
  InvoiceStatus,
  InvoiceSummary,
  PaymentMethod,
  ServiceCategory,
  ServicePrice,
  ServicePriceRequest,
} from './financial.model';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/financial`;

  prices(
    query: { search?: string; category?: ServiceCategory | null; active?: boolean } = {},
  ): Observable<ServicePrice[]> {
    let params = new HttpParams();
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.category) params = params.set('category', query.category);
    if (query.active !== undefined) params = params.set('active', query.active);
    return this.http.get<ServicePrice[]>(`${this.baseUrl}/prices`, { params });
  }

  createPrice(request: ServicePriceRequest): Observable<ServicePrice> {
    return this.http.post<ServicePrice>(`${this.baseUrl}/prices`, request);
  }

  updatePrice(id: string, request: ServicePriceRequest): Observable<ServicePrice> {
    return this.http.put<ServicePrice>(`${this.baseUrl}/prices/${encodeURIComponent(id)}`, request);
  }

  setPriceActive(id: string, active: boolean): Observable<ServicePrice> {
    return this.http.patch<ServicePrice>(
      `${this.baseUrl}/prices/${encodeURIComponent(id)}/${active ? 'activate' : 'deactivate'}`,
      null,
    );
  }

  invoices(
    query: {
      status?: InvoiceStatus | null;
      type?: DocumentType | null;
      patientId?: string | null;
      episodeId?: string | null;
      number?: string;
      from?: string;
      to?: string;
      page?: number;
    } = {},
  ): Observable<Page<InvoiceSummary>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, value);
    }
    return this.http.get<Page<InvoiceSummary>>(`${this.baseUrl}/invoices`, { params });
  }

  invoice(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(this.url(id));
  }

  create(request: InvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.baseUrl}/invoices`, request);
  }

  update(id: string, request: InvoiceRequest): Observable<Invoice> {
    return this.http.put<Invoice>(this.url(id), request);
  }

  deleteDraft(id: string): Observable<void> {
    return this.http.delete<void>(this.url(id));
  }

  issue(
    id: string,
    payment: { paymentMethod: PaymentMethod; reference: string | null } | null = null,
  ): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.url(id)}/issue`, payment);
  }

  pay(
    id: string,
    body: { amount: number; method: PaymentMethod; reference: string | null },
  ): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.url(id)}/payments`, body);
  }

  cancel(id: string, reason: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.url(id)}/cancel`, { reason });
  }

  creditNote(id: string, reason: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.url(id)}/credit-note`, { reason });
  }

  cash(date?: string): Observable<CashSummary> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<CashSummary>(`${this.baseUrl}/cash`, { params });
  }

  private url(id: string): string {
    return `${this.baseUrl}/invoices/${encodeURIComponent(id)}`;
  }
}
