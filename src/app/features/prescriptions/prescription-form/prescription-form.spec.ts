import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { EpisodeService } from '../../episodes/data/episode.service';
import { PatientService } from '../../patients/data/patient.service';
import { PharmacyService } from '../../pharmacy/data/pharmacy.service';
import { Medication } from '../../pharmacy/data/pharmacy.model';
import { PrescriptionService } from '../data/prescription.service';
import { PrescriptionForm } from './prescription-form';

const MED = {
  id: 'm1',
  name: 'Amoxicilina',
  strength: '500 mg',
  dispensingUnit: 'cápsula',
  stockAvailable: 3,
  requiresPrescription: true,
  dosageForm: 'CAPSULE',
} as Medication;

function setup() {
  const create = vi.fn().mockReturnValue(of({ id: 'rx1' }));
  TestBed.configureTestingModule({
    imports: [PrescriptionForm],
    providers: [
      provideRouter([]),
      { provide: PrescriptionService, useValue: { create } },
      {
        provide: EpisodeService,
        useValue: {
          view: () =>
            of({
              id: 'e1',
              status: 'IN_PROGRESS',
              patientId: 'p1',
              patientName: 'Ana',
              patientRecordNumber: '000001',
              reason: 'Febre',
            }),
        },
      },
      {
        provide: PatientService,
        useValue: { view: () => of({ id: 'p1', allergies: 'Penicilina' }) },
      },
      { provide: PharmacyService, useValue: { search: vi.fn() } },
    ],
  });
  vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(PrescriptionForm);
  fixture.componentRef.setInput('episodeId', 'e1');
  fixture.detectChanges();
  return { fixture, create };
}

describe('PrescriptionForm', () => {
  it('mostra as alergias do paciente em destaque', () => {
    const { fixture } = setup();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.alert-error')?.textContent,
    ).toContain('Penicilina');
  });

  it('não repete medicamentos e avisa de stock insuficiente', () => {
    const { fixture } = setup();
    const c = fixture.componentInstance as unknown as {
      add(m: Medication): void;
      lines(): { quantity: number }[];
    };
    c.add(MED);
    c.add(MED);
    expect(c.lines().length).toBe(1);
    c.lines()[0].quantity = 21;
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.stock-warning')?.textContent,
    ).toContain('3 cápsula');
  });

  it('emite com as linhas sem o objecto do medicamento', () => {
    const { fixture, create } = setup();
    const c = fixture.componentInstance as unknown as { add(m: Medication): void };
    c.add(MED);
    fixture.componentInstance.submit();
    expect(create).toHaveBeenCalledWith({
      episodeId: 'e1',
      validityDays: 30,
      notes: null,
      items: [
        {
          medicationId: 'm1',
          quantity: 1,
          dosage: '1 cápsula',
          frequency: 'de 8 em 8 horas',
          durationDays: 7,
          route: 'ORAL',
          instructions: null,
        },
      ],
    });
  });
});
