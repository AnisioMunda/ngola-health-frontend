import { registerLocaleData } from '@angular/common';
import localePtAo from '@angular/common/locales/pt-AO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { Batch, Medication } from '../data/pharmacy.model';
import { PharmacyService } from '../data/pharmacy.service';
import { MedicationDetail } from './medication-detail';

registerLocaleData(localePtAo);

const MED: Medication = {
  id: 'm1',
  name: 'Paracetamol',
  genericName: 'Paracetamol',
  dosageForm: 'TABLET',
  strength: '500 mg',
  dispensingUnit: 'comprimido',
  requiresPrescription: false,
  minStockLevel: 20,
  active: true,
  stockAvailable: 8,
  lowStock: true,
  nextExpiry: '2027-01-01',
  version: 0,
};

function batch(extra: Partial<Batch>): Batch {
  return {
    id: 'b1',
    medicationId: 'm1',
    medicationName: 'Paracetamol 500 mg',
    batchNumber: 'L1',
    expiryDate: '2027-01-01',
    quantityReceived: 10,
    quantityAvailable: 8,
    unitCost: 150.5,
    supplier: 'X',
    receivedAt: '2026-11-01T10:00:00Z',
    receivedByName: 'Farm. Rui',
    expired: false,
    daysToExpiry: 50,
    ...extra,
  };
}

function render(roles: Role[]) {
  const service = {
    medication: vi.fn().mockReturnValue(of(MED)),
    batches: vi
      .fn()
      .mockReturnValue(
        of([
          batch({}),
          batch({ id: 'b2', batchNumber: 'OLD', expired: true, quantityAvailable: 3 }),
        ]),
      ),
    movements: vi.fn().mockReturnValue(
      of({
        content: [
          {
            id: 'mv',
            batchId: 'b1',
            batchNumber: 'L1',
            type: 'DISPENSE',
            quantity: -2,
            balanceAfter: 8,
            patientId: null,
            episodeId: null,
            referenceId: null,
            reason: null,
            performedByName: 'Farm. Rui',
            performedAt: '2026-11-02T10:00:00Z',
          },
        ],
        page: 0,
        size: 50,
        totalElements: 1,
        totalPages: 1,
      }),
    ),
    adjust: vi.fn().mockReturnValue(of(batch({}))),
    writeOffExpired: vi.fn().mockReturnValue(of(batch({}))),
    setActive: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [MedicationDetail],
    providers: [
      provideRouter([]),
      { provide: LOCALE_ID, useValue: 'pt-AO' },
      { provide: PharmacyService, useValue: service },
      {
        provide: AuthService,
        useValue: { hasAnyRole: (r: Role[]) => roles.some((x) => r.includes(x)) },
      },
    ],
  });
  const fixture = TestBed.createComponent(MedicationDetail);
  fixture.componentRef.setInput('id', 'm1');
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, service };
}

describe('MedicationDetail', () => {
  it('mostra stock, alerta de mínimo, lotes com custo em kwanzas e movimentos', () => {
    const { el } = render(['DOCTOR']);
    expect(el.querySelector('.stock')?.textContent).toContain('Abaixo do mínimo');
    expect(el.textContent).toMatch(/150,50\s*Kz/);
    expect(el.querySelector('tr.expired')?.textContent).toContain('OLD');
    expect(el.querySelector('td.out')?.textContent).toContain('-2');
    expect(el.querySelectorAll('td.actions button').length).toBe(0);
  });

  it('o farmacêutico abate lotes expirados e faz acertos com motivo', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, service } = render(['PHARMACIST']);
    const buttons = [...el.querySelectorAll('td.actions button')].map((b) => b.textContent?.trim());
    expect(buttons).toEqual(['Acerto', 'Abater expirado']);

    (el.querySelectorAll('td.actions button')[1] as HTMLButtonElement).click();
    expect(service.writeOffExpired).toHaveBeenCalledWith('b2');

    (el.querySelectorAll('td.actions button')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    const c = fixture.componentInstance as unknown as {
      adjustReason: string;
      adjustQuantity: number;
      saveAdjust(): void;
    };
    c.adjustQuantity = 2;
    c.adjustReason = ' ';
    c.saveAdjust();
    expect(service.adjust).not.toHaveBeenCalled();
    c.adjustReason = 'Contagem mensal';
    c.saveAdjust();
    expect(service.adjust).toHaveBeenCalledWith('b1', 'COUNT_SHORTAGE', 2, 'Contagem mensal');
  });
});
