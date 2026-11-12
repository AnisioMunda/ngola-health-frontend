import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { ItemStatus, LabItem, LabRequest, LabRequestStatus } from '../data/lab.model';
import { LabService } from '../data/lab.service';
import { LabRequestDetail } from './lab-request-detail';

function item(status: ItemStatus, extra: Partial<LabItem> = {}): LabItem {
  return {
    id: 'hb',
    labTestId: 't',
    testCode: 'HB',
    testName: 'Hemoglobina',
    resultType: 'NUMERIC',
    unit: 'g/dL',
    referenceLow: 12,
    referenceHigh: 16,
    referenceText: null,
    status,
    resultVisible: false,
    numericValue: null,
    textValue: null,
    flag: null,
    resultNotes: null,
    resultedAt: null,
    resultedByName: null,
    validatedAt: null,
    validatedByName: null,
    amended: false,
    amendments: [],
    ...extra,
  };
}

function request(status: LabRequestStatus, items: LabItem[]): LabRequest {
  return {
    id: 'r1',
    number: 'LAB-2026-000001',
    patientId: 'p',
    patientName: 'Ana',
    patientRecordNumber: '000001',
    episodeId: 'e',
    requestedByName: 'Dr. Rui',
    requestedAt: '2026-11-12T10:00:00Z',
    priority: 'URGENT',
    clinicalInfo: null,
    status,
    collectedAt: null,
    collectedByName: null,
    collectionNotes: null,
    analysisStartedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelledByName: null,
    cancellationReason: null,
    hasAbnormal: false,
    items,
    version: 0,
  };
}

function render(roles: Role[], r: LabRequest) {
  const service = {
    view: vi.fn().mockReturnValue(of(r)),
    collect: vi.fn().mockReturnValue(of(r)),
    result: vi.fn().mockReturnValue(of(r)),
    validate: vi.fn().mockReturnValue(of(r)),
    amend: vi.fn().mockReturnValue(of(r)),
    start: vi.fn(),
    cancel: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [LabRequestDetail],
    providers: [
      provideRouter([]),
      { provide: LabService, useValue: service },
      {
        provide: AuthService,
        useValue: { hasAnyRole: (x: Role[]) => roles.some((y) => x.includes(y)) },
      },
    ],
  });
  const fixture = TestBed.createComponent(LabRequestDetail);
  fixture.componentRef.setInput('id', 'r1');
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, service };
}

describe('LabRequestDetail', () => {
  it('a enfermagem regista a colheita de um pedido pendente', () => {
    const { el, service } = render(['NURSE'], request('PENDING', [item('PENDING')]));
    const button = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Registar colheita'),
    )!;
    button.click();
    expect(service.collect).toHaveBeenCalledWith('r1', null);
  });

  it('o técnico regista resultado numérico e valida', () => {
    const { fixture, el, service } = render(
      ['LAB_TECHNICIAN'],
      request('IN_ANALYSIS', [
        item('RESULTED', { numericValue: 10.5, resultVisible: true, flag: 'LOW' }),
      ]),
    );
    expect(el.textContent).toContain('Baixo');
    expect(el.textContent).toContain('12 – 16 g/dL');
    fixture.componentInstance.saveResult(fixture.componentInstance['request']()!.items[0]);
    expect(service.result).toHaveBeenCalledWith('r1', 'hb', {
      numericValue: 10.5,
      textValue: null,
      abnormal: false,
      notes: null,
    });
    fixture.componentInstance.validate(fixture.componentInstance['request']()!.items[0]);
    expect(service.validate).toHaveBeenCalledWith('r1', 'hb');
  });

  it('o médico não vê resultados por validar', () => {
    const { el } = render(['DOCTOR'], request('IN_ANALYSIS', [item('RESULTED')]));
    expect(el.textContent).toContain('Aguarda validação');
    expect(el.querySelector('.entry')).toBeNull();
  });

  it('a correcção de resultado validado exige motivo', () => {
    const r = request('COMPLETED', [
      item('VALIDATED', { numericValue: 13, resultVisible: true, flag: 'NORMAL' }),
    ]);
    const { fixture, service } = render(['LAB_TECHNICIAN'], r);
    const c = fixture.componentInstance;
    c['drafts']['hb'].numericValue = 8;
    c.saveAmendment(r.items[0]);
    expect(service.amend).not.toHaveBeenCalled();
    c['drafts']['hb'].reason = 'Erro de transcrição';
    c.saveAmendment(r.items[0]);
    expect(service.amend).toHaveBeenCalledWith(
      'r1',
      'hb',
      expect.objectContaining({ numericValue: 8, reason: 'Erro de transcrição' }),
    );
  });
});
