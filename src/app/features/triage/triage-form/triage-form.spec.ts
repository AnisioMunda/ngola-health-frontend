import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PatientService } from '../../patients/data/patient.service';
import { TriageService } from '../data/triage.service';
import { TriageForm } from './triage-form';

describe('TriageForm', () => {
  let create: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    create = vi.fn().mockReturnValue(of({ queueNumber: 7, displayName: 'Desconhecido' }));
    TestBed.configureTestingModule({
      imports: [TriageForm],
      providers: [
        provideRouter([]),
        { provide: TriageService, useValue: { create } },
        { provide: PatientService, useValue: { search: vi.fn() } },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  function build() {
    const fixture = TestBed.createComponent(TriageForm);
    fixture.detectChanges();
    return fixture.componentInstance as TriageForm & {
      setMode(m: 'registered' | 'provisional'): void;
      patient: { set(v: unknown): void };
    };
  }

  it('exige paciente ou modo provisório', () => {
    const c = build();
    c.form.patchValue({ priority: 'RED', chiefComplaint: 'Dor torácica' });
    c.submit();
    expect(create).not.toHaveBeenCalled();
  });

  it('exige prioridade (sem valor por omissão)', () => {
    const c = build();
    c.setMode('provisional');
    c.form.patchValue({ chiefComplaint: 'Dor torácica' });
    c.submit();
    expect(create).not.toHaveBeenCalled();
    expect(c.form.controls.priority.invalid).toBe(true);
  });

  it('regista doente provisório com sinais vitais só quando preenchidos', () => {
    const c = build();
    c.setMode('provisional');
    c.form.patchValue({ tempAge: 40, priority: 'ORANGE', chiefComplaint: ' Dor torácica ' });
    c.submit();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: null,
        tempName: 'Desconhecido',
        tempAge: 40,
        priority: 'ORANGE',
        chiefComplaint: 'Dor torácica',
        vitals: null,
      }),
    );
  });

  it('com paciente registado envia o id e os sinais vitais', () => {
    const c = build();
    c.patient.set({ id: 'p1', fullName: 'Ana', recordNumber: '000001', age: 30 });
    c.form.patchValue({ priority: 'YELLOW', chiefComplaint: 'Febre', temperature: 39.2 });
    c.submit();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'p1',
        tempName: null,
        vitals: expect.objectContaining({ temperature: 39.2, heartRate: null }),
      }),
    );
  });
});
