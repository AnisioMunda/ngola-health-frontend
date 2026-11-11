import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Patient } from '../data/patient.model';
import { PatientService } from '../data/patient.service';
import { PatientForm } from './patient-form';

const SAVED = { id: 'p1', recordNumber: '000007' } as Patient;

describe('PatientForm', () => {
  let service: Record<
    'view' | 'create' | 'update' | 'possibleDuplicates',
    ReturnType<typeof vi.fn>
  >;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = { view: vi.fn(), create: vi.fn(), update: vi.fn(), possibleDuplicates: vi.fn() };
    TestBed.configureTestingModule({
      imports: [PatientForm],
      providers: [provideRouter([]), { provide: PatientService, useValue: service }],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  function create() {
    const fixture = TestBed.createComponent(PatientForm);
    fixture.detectChanges();
    return fixture;
  }

  function fill(c: PatientForm) {
    c.form.patchValue({
      fullName: '  Ana   Silva ',
      birthDate: '1990-05-01',
      gender: 'FEMALE',
      nationalId: '004468681la042',
      phone: '923 000 000',
    });
  }

  it('sem duplicados regista directamente com dados limpos', () => {
    service.possibleDuplicates.mockReturnValue(of([]));
    service.create.mockReturnValue(of(SAVED));
    const c = create().componentInstance;
    fill(c);
    c.submit();

    expect(service.possibleDuplicates).toHaveBeenCalledWith({
      fullName: 'Ana Silva',
      birthDate: '1990-05-01',
      nationalId: '004468681LA042',
      phone: '923 000 000',
    });
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Ana Silva', email: null, version: null }),
    );
    expect(navigate).toHaveBeenCalledWith(['/patients', 'p1'], {
      state: { notice: 'Paciente registado com o processo 000007.' },
    });
  });

  it('com possíveis duplicados pede confirmação antes de registar', () => {
    service.possibleDuplicates.mockReturnValue(
      of([{ id: 'x', fullName: 'Ana Maria Silva', recordNumber: '000001', age: 35 }]),
    );
    service.create.mockReturnValue(of(SAVED));
    const fixture = create();
    const c = fixture.componentInstance;
    fill(c);
    c.submit();
    fixture.detectChanges();

    expect(service.create).not.toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.duplicates')?.textContent).toContain('Ana Maria Silva');

    c.confirmNew();
    expect(service.create).toHaveBeenCalled();
  });

  it('se a verificação de duplicados falhar, regista na mesma', () => {
    service.possibleDuplicates.mockReturnValue(throwError(() => new Error('rede')));
    service.create.mockReturnValue(of(SAVED));
    const c = create().componentInstance;
    fill(c);
    c.submit();
    expect(service.create).toHaveBeenCalled();
  });

  it('valida BI, data futura e obrigatórios', () => {
    const c = create().componentInstance;
    c.form.patchValue({
      fullName: 'Ana',
      birthDate: '2999-01-01',
      gender: 'FEMALE',
      nationalId: '123',
    });
    c.submit();
    expect(service.possibleDuplicates).not.toHaveBeenCalled();
    expect(c.form.controls.nationalId.invalid).toBe(true);
    expect(c.form.controls.birthDate.hasError('future')).toBe(true);
  });
});
