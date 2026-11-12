import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { EffectiveStatus, Prescription } from '../data/prescription.model';
import { PrescriptionService } from '../data/prescription.service';
import { PrescriptionDetail } from './prescription-detail';

function rx(effectiveStatus: EffectiveStatus): Prescription {
  return {
    id: 'rx1',
    number: 'RX-2026-000001',
    patientId: 'p1',
    patientName: 'Ana Silva',
    patientRecordNumber: '000001',
    episodeId: 'e1',
    prescriberId: 'd1',
    prescriberName: 'Dr. Rui',
    status: effectiveStatus === 'EXPIRED' ? 'ACTIVE' : effectiveStatus,
    effectiveStatus,
    issuedAt: '2026-11-12T10:00:00Z',
    validUntil: '2026-12-12',
    notes: null,
    cancelledAt: null,
    cancelledByName: null,
    cancellationReason: null,
    version: 0,
    items: [
      {
        id: 'i1',
        lineNumber: 1,
        medicationId: 'm1',
        medicationName: 'Amoxicilina 500 mg',
        dispensingUnit: 'cápsula',
        quantity: 21,
        quantityDispensed: 0,
        remaining: 21,
        dosage: '1 cápsula',
        frequency: 'de 8 em 8 horas',
        durationDays: 7,
        route: 'ORAL',
        instructions: null,
        stockAvailable: 15,
      },
      {
        id: 'i2',
        lineNumber: 2,
        medicationId: 'm2',
        medicationName: 'Paracetamol 500 mg',
        dispensingUnit: 'comprimido',
        quantity: 5,
        quantityDispensed: 5,
        remaining: 0,
        dosage: '1 comprimido',
        frequency: 'se dor',
        durationDays: null,
        route: 'ORAL',
        instructions: null,
        stockAvailable: 50,
      },
    ],
  };
}

function render(roles: Role[], status: EffectiveStatus) {
  const service = {
    view: vi.fn().mockReturnValue(of(rx(status))),
    dispense: vi.fn().mockReturnValue(of(rx('DISPENSED'))),
    cancel: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [PrescriptionDetail],
    providers: [
      provideRouter([]),
      { provide: PrescriptionService, useValue: service },
      {
        provide: AuthService,
        useValue: { hasAnyRole: (r: Role[]) => roles.some((x) => r.includes(x)) },
      },
    ],
  });
  const fixture = TestBed.createComponent(PrescriptionDetail);
  fixture.componentRef.setInput('id', 'rx1');
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, service };
}

describe('PrescriptionDetail', () => {
  it('farmacêutico: propõe dispensar o que há em stock e envia só linhas com quantidade', () => {
    const { fixture, el, service } = render(['PHARMACIST'], 'ACTIVE');
    expect(el.querySelectorAll('input.qty').length).toBe(1);
    expect(el.querySelector('td.short')?.textContent).toContain('15');
    fixture.componentInstance.dispense();
    expect(service.dispense).toHaveBeenCalledWith('rx1', [{ itemId: 'i1', quantity: 15 }]);
  });

  it('médico pode cancelar mas não dispensar', () => {
    const { el } = render(['DOCTOR'], 'ACTIVE');
    expect(el.querySelector('input.qty')).toBeNull();
    expect(
      [...el.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Cancelar'),
    ).toBe(true);
  });

  it('prescrição caducada: sem dispensa nem cancelamento', () => {
    const { el } = render(['PHARMACIST', 'DOCTOR'], 'EXPIRED');
    expect(el.querySelector('.badge')?.textContent).toContain('Caducada');
    expect(el.querySelector('input.qty')).toBeNull();
    expect(
      [...el.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Cancelar'),
    ).toBe(false);
  });
});
