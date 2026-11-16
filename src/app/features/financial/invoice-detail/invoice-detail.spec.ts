import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { DocumentType, Invoice, InvoiceStatus } from '../data/financial.model';
import { FinancialService } from '../data/financial.service';
import { InvoiceDetail } from './invoice-detail';

function invoice(type: DocumentType, status: InvoiceStatus, paid = 0): Invoice {
  return {
    id: 'i1',
    documentType: type,
    number: status === 'DRAFT' ? null : `${type} 2026/000001`,
    status,
    patientId: 'p',
    patientName: 'Ana Silva',
    patientRecordNumber: '000001',
    customerName: 'Ana Silva',
    grossTotal: 114,
    paidTotal: paid,
    balance: 114 - paid,
    createdAt: '2026-11-16T10:00:00Z',
    issuedAt: status === 'DRAFT' ? null : '2026-11-16T10:05:00Z',
    dueDate: null,
    overdue: false,
    episodeId: null,
    customerTaxId: null,
    customerAddress: null,
    issuerName: 'Hospital',
    issuerTaxId: '5417000000',
    issuerAddress: 'Luanda',
    currency: 'AOA',
    netTotal: 100,
    vatTotal: 14,
    notes: null,
    relatedInvoiceId: null,
    relatedInvoiceNumber: null,
    creditReason: null,
    creditNoteId: null,
    creditNoteNumber: null,
    createdByName: 'Recepção',
    issuedByName: null,
    cancelledByName: null,
    cancelledAt: null,
    cancellationReason: null,
    items: [
      {
        lineNumber: 1,
        servicePriceId: null,
        code: null,
        description: 'Consulta',
        quantity: 1,
        unitPrice: 100,
        discountPercent: 0,
        vatRate: 14,
        vatExemptionReason: null,
        discountAmount: 0,
        netAmount: 100,
        vatAmount: 14,
        grossAmount: 114,
      },
    ],
    payments: [],
    version: 0,
  };
}

function render(roles: Role[], inv: Invoice) {
  const service = {
    invoice: vi.fn().mockReturnValue(of(inv)),
    issue: vi.fn().mockReturnValue(of({ ...inv, status: 'PAID', number: 'FR 2026/000001' })),
  };
  TestBed.configureTestingModule({
    imports: [InvoiceDetail],
    providers: [
      provideRouter([]),
      { provide: FinancialService, useValue: service },
      {
        provide: AuthService,
        useValue: {
          hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(InvoiceDetail);
  fixture.componentRef.setInput('id', 'i1');
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const actions = () =>
    [...el.querySelectorAll('.header-actions a, .header-actions button')].map((b) =>
      b.textContent?.trim(),
    );
  return { fixture, el, service, actions };
}

describe('InvoiceDetail', () => {
  it('rascunho: editar, eliminar e emitir; sem imprimir', () => {
    expect(render(['RECEPTIONIST'], invoice('FR', 'DRAFT')).actions()).toEqual([
      'Editar',
      'Eliminar',
      'Emitir',
    ]);
  });

  it('factura emitida sem pagamentos: a caixa recebe; o financeiro também anula', () => {
    expect(render(['RECEPTIONIST'], invoice('FT', 'ISSUED')).actions()).toEqual([
      'Imprimir',
      'Receber',
    ]);
    TestBed.resetTestingModule();
    expect(render(['FINANCIAL'], invoice('FT', 'ISSUED')).actions()).toEqual([
      'Imprimir',
      'Receber',
      'Anular',
      'Nota de crédito',
    ]);
  });

  it('paga: só nota de crédito, não anulação', () => {
    expect(render(['FINANCIAL'], invoice('FT', 'PAID', 114)).actions()).toEqual([
      'Imprimir',
      'Nota de crédito',
    ]);
  });

  it('emitir uma factura-recibo envia o meio de pagamento', () => {
    const { el, fixture, service } = render(['RECEPTIONIST'], invoice('FR', 'DRAFT'));
    [...el.querySelectorAll<HTMLButtonElement>('.header-actions button')]
      .find((b) => b.textContent?.includes('Emitir'))!
      .click();
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    expect(service.issue).toHaveBeenCalledWith('i1', { paymentMethod: 'CASH', reference: null });
  });

  it('o rascunho diz claramente que não tem valor fiscal', () => {
    const { el } = render(['RECEPTIONIST'], invoice('FT', 'DRAFT'));
    expect(el.querySelector('.doc-number')?.textContent).toContain('sem valor fiscal');
  });
});
