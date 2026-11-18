import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { Criticality, Equipment, EquipmentStatus } from '../data/equipment.model';
import { EquipmentService } from '../data/equipment.service';
import { EquipmentDetail } from './equipment-detail';

function equipment(
  status: EquipmentStatus,
  criticality: Criticality,
  openFault = false,
): Equipment {
  return {
    id: 'e1',
    code: 'VENT-01',
    name: 'Ventilador',
    category: 'LIFE_SUPPORT',
    criticality,
    brand: null,
    model: null,
    serialNumber: null,
    wardId: null,
    wardName: 'UCI',
    location: null,
    status,
    purchaseDate: null,
    purchasePrice: null,
    warrantyUntil: null,
    underWarranty: false,
    maintenanceIntervalDays: 180,
    nextMaintenanceDate: '2026-12-01',
    maintenanceOverdue: false,
    calibrationIntervalDays: null,
    nextCalibrationDate: null,
    calibrationOverdue: false,
    notes: null,
    retiredAt: null,
    retiredByName: null,
    retirementReason: null,
    faults: openFault
      ? [
          {
            id: 'f1',
            equipmentId: 'e1',
            equipmentName: 'Ventilador',
            equipmentCode: 'VENT-01',
            criticality,
            description: 'Alarme',
            outOfService: true,
            status: 'OPEN',
            reportedByName: 'Enf. Ana',
            reportedAt: '2026-11-17T10:00:00Z',
            resolvedAt: null,
            resolution: null,
          },
        ]
      : [],
    maintenance: [],
    maintenanceCostTotal: 0,
    version: 0,
  };
}

function render(roles: Role[], e: Equipment) {
  const service = {
    view: vi.fn().mockReturnValue(of(e)),
    reportFault: vi.fn().mockReturnValue(of({ ...e, status: 'OUT_OF_SERVICE' })),
    recordMaintenance: vi.fn().mockReturnValue(of({ ...e, status: 'OPERATIONAL' })),
  };
  TestBed.configureTestingModule({
    imports: [EquipmentDetail],
    providers: [
      provideRouter([]),
      { provide: EquipmentService, useValue: service },
      {
        provide: AuthService,
        useValue: {
          hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(EquipmentDetail);
  fixture.componentRef.setInput('id', 'e1');
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const actions = () =>
    [...el.querySelectorAll('.header-actions a, .header-actions button')].map((b) =>
      b.textContent?.trim(),
    );
  return { fixture, el, service, actions };
}

const button = (el: HTMLElement, text: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text);

describe('EquipmentDetail', () => {
  it('qualquer profissional reporta avaria; só a gestão faz o resto', () => {
    expect(render(['NURSE'], equipment('OPERATIONAL', 'MEDIUM')).actions()).toEqual([
      'Reportar avaria',
    ]);
    TestBed.resetTestingModule();
    expect(render(['MANAGER'], equipment('OPERATIONAL', 'MEDIUM')).actions()).toEqual([
      'Reportar avaria',
      'Enviar para manutenção',
      'Registar manutenção',
      'Editar',
      'Abater',
    ]);
  });

  it('num equipamento crítico não se pergunta se pode ser usado', async () => {
    const { el, fixture, service } = render(['NURSE'], equipment('OPERATIONAL', 'HIGH'));
    button(el, 'Reportar avaria')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('input[name=oos]')).toBeNull();
    expect(el.textContent).toContain('fica fora de serviço');
    const text = el.querySelector<HTMLTextAreaElement>('textarea[name=description]')!;
    text.value = 'Alarme constante';
    text.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    expect(service.reportFault).toHaveBeenCalledWith('e1', 'Alarme constante', false);
  });

  it('com avaria aberta, a manutenção começa como correctiva ligada à avaria', () => {
    const { el, fixture } = render(['MANAGER'], equipment('OUT_OF_SERVICE', 'HIGH', true));
    button(el, 'Registar manutenção')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance['m'].type).toBe('CORRECTIVE');
    expect(fixture.componentInstance['m'].faultId).toBe('f1');
  });

  it('abatido: sem acções', () => {
    const { el } = render(['MANAGER'], equipment('RETIRED', 'LOW'));
    expect(el.querySelector('.header-actions')).toBeNull();
  });
});
