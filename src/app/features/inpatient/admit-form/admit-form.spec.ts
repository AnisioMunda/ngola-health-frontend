import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { EpisodeService } from '../../episodes/data/episode.service';
import { Patient } from '../../patients/data/patient.model';
import { PatientService } from '../../patients/data/patient.service';
import { Ward } from '../data/inpatient.model';
import { InpatientService } from '../data/inpatient.service';
import { AdmitForm } from './admit-form';

const ward = (id: string, genderPolicy: Ward['genderPolicy'], available = 1): Ward => ({
  id,
  code: id,
  name: 'Enf ' + id,
  type: 'MEDICINE',
  genderPolicy,
  floor: null,
  notes: null,
  active: true,
  beds: 2,
  available,
  occupied: 2 - available,
  cleaning: 0,
  maintenance: 0,
  version: 0,
});

function render() {
  const service = {
    wards: vi
      .fn()
      .mockReturnValue(of([ward('F', 'FEMALE'), ward('M', 'MALE'), ward('X', 'MIXED')])),
    map: vi.fn().mockReturnValue(
      of({
        ward: ward('F', 'FEMALE'),
        beds: [
          {
            id: 'b1',
            wardId: 'F',
            code: '1',
            type: 'STANDARD',
            status: 'OCCUPIED',
            statusNote: null,
            active: true,
            occupant: null,
          },
          {
            id: 'b2',
            wardId: 'F',
            code: '2',
            type: 'STANDARD',
            status: 'AVAILABLE',
            statusNote: null,
            active: true,
            occupant: null,
          },
        ],
      }),
    ),
    admit: vi.fn().mockReturnValue(of({ id: 'a1' })),
  };
  const patient = {
    id: 'p1',
    fullName: 'Ana Silva',
    recordNumber: '000001',
    age: 46,
    gender: 'FEMALE',
  } as Patient;
  TestBed.configureTestingModule({
    imports: [AdmitForm],
    providers: [
      provideRouter([]),
      { provide: InpatientService, useValue: service },
      { provide: PatientService, useValue: { view: () => of(patient), search: vi.fn() } },
      {
        provide: EpisodeService,
        useValue: { doctors: () => of([{ id: 'd1', fullName: 'Dr. Rui', specialty: null }]) },
      },
      { provide: AuthService, useValue: { user: () => ({ id: 'd1', roles: ['DOCTOR'] }) } },
    ],
  });
  vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AdmitForm);
  fixture.componentRef.setInput('patientId', 'p1');
  fixture.componentRef.setInput('originEpisodeId', 'e1');
  fixture.componentRef.setInput('wardId', 'F');
  fixture.componentRef.setInput('bedId', 'b2');
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, service };
}

describe('AdmitForm', () => {
  it('só mostra enfermarias compatíveis com o sexo e camas livres', () => {
    const { el } = render();
    const wards = [...el.querySelectorAll('select[name=ward] option')].map((o) =>
      o.textContent?.trim(),
    );
    expect(wards.some((w) => w?.startsWith('Enf F'))).toBe(true);
    expect(wards.some((w) => w?.startsWith('Enf X'))).toBe(true);
    expect(wards.some((w) => w?.startsWith('Enf M'))).toBe(false);
    const beds = [...el.querySelectorAll('select[name=bed] option')].map((o) =>
      o.textContent?.trim(),
    );
    expect(beds).toEqual(['Seleccione…', '2']);
  });

  it('interna com a cama pré-seleccionada e o episódio de origem', () => {
    const { el, fixture, service } = render();
    const reason = el.querySelector<HTMLTextAreaElement>('textarea[name=reason]')!;
    reason.value = 'Pneumonia';
    reason.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    [...el.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Internar')!
      .click();
    expect(service.admit).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'p1',
        bedId: 'b2',
        originEpisodeId: 'e1',
        reason: 'Pneumonia',
      }),
    );
  });
});
