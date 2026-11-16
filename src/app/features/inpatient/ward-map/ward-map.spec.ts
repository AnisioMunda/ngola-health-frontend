import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { Bed, WardMap as WardMapData } from '../data/inpatient.model';
import { InpatientService } from '../data/inpatient.service';
import { WardMap } from './ward-map';

const bed = (code: string, status: Bed['status'], occupant: Bed['occupant'] = null): Bed => ({
  id: 'b' + code,
  wardId: 'w',
  code,
  type: 'STANDARD',
  status,
  statusNote: null,
  active: true,
  occupant,
});

const data: WardMapData = {
  ward: {
    id: 'w',
    code: 'MF',
    name: 'Medicina Mulheres',
    type: 'MEDICINE',
    genderPolicy: 'FEMALE',
    floor: '2',
    notes: null,
    active: true,
    beds: 3,
    available: 1,
    occupied: 1,
    cleaning: 1,
    maintenance: 0,
    version: 0,
  },
  beds: [
    bed('1', 'OCCUPIED', {
      admissionId: 'a1',
      admissionNumber: 'INT-2026-000001',
      patientId: 'p',
      patientName: 'Ana Silva',
      patientRecordNumber: '000001',
      gender: 'FEMALE',
      age: 46,
      responsibleDoctorName: 'Dr. Rui',
      admittedAt: '2026-11-14T10:00:00Z',
      expectedDischargeDate: null,
    }),
    bed('2', 'AVAILABLE'),
    bed('3', 'CLEANING'),
  ],
};

function render(roles: Role[]) {
  const service = {
    map: vi.fn().mockReturnValue(of(data)),
    setBedStatus: vi.fn().mockReturnValue(of(bed('3', 'AVAILABLE'))),
  };
  TestBed.configureTestingModule({
    imports: [WardMap],
    providers: [
      provideRouter([]),
      { provide: InpatientService, useValue: service },
      {
        provide: AuthService,
        useValue: {
          hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(WardMap);
  fixture.componentRef.setInput('id', 'w');
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const actions = (i: number) =>
    [...el.querySelectorAll('li.bed')[i].querySelectorAll('.actions a, .actions button')].map((b) =>
      b.textContent?.trim(),
    );
  return { el, service, actions };
}

describe('WardMap', () => {
  it('mostra o doente da cama ocupada e liga ao internamento', () => {
    const { el } = render(['NURSE']);
    const occupant = el.querySelector<HTMLAnchorElement>('.occupant')!;
    expect(occupant.textContent).toContain('Ana Silva');
    expect(occupant.getAttribute('href')).toBe('/inpatient/admissions/a1');
  });

  it('a enfermagem marca camas como limpas; só o médico interna', () => {
    const nurse = render(['NURSE']);
    expect(nurse.actions(1)).toEqual(['Manutenção']);
    expect(nurse.actions(2)).toEqual(['Limpa', 'Manutenção']);
    TestBed.resetTestingModule();
    const doctor = render(['DOCTOR']);
    expect(doctor.actions(1)).toEqual(['Internar']);
    expect(doctor.actions(2)).toEqual([]);
  });

  it('marcar como limpa pede o estado AVAILABLE', () => {
    const { el, service } = render(['NURSE']);
    [...el.querySelectorAll<HTMLButtonElement>('li.bed')[2].querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Limpa'))!
      .click();
    expect(service.setBedStatus).toHaveBeenCalledWith('b3', 'AVAILABLE');
  });
});
