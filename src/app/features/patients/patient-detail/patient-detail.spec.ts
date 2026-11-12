import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { Patient } from '../data/patient.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import { PatientService } from '../data/patient.service';
import { PatientDetail } from './patient-detail';

const PATIENT = {
  id: 'p1',
  recordNumber: '000001',
  fullName: 'Ana Silva',
  birthDate: '1990-05-01',
  age: 36,
  gender: 'FEMALE',
  allergies: 'Penicilina',
  province: 'Luanda',
  municipality: null,
  active: true,
  createdAt: '2026-11-10T10:00:00Z',
  updatedAt: '2026-11-10T10:00:00Z',
} as unknown as Patient;

function render(roles: Role[]) {
  TestBed.configureTestingModule({
    imports: [PatientDetail],
    providers: [
      provideRouter([]),
      { provide: PatientService, useValue: { view: () => of(PATIENT) } },
      {
        provide: EpisodeService,
        useValue: {
          search: () =>
            of({
              content: [
                {
                  id: 'e1',
                  scheduledAt: '2026-11-10T09:00:00Z',
                  type: 'OUTPATIENT',
                  status: 'COMPLETED',
                  reason: 'Febre',
                  doctorName: 'Dr. Rui',
                },
              ],
              page: 0,
              size: 10,
              totalElements: 1,
              totalPages: 1,
            }),
        },
      },
      {
        provide: AuthService,
        useValue: { hasAnyRole: (r: Role[]) => roles.some((x) => r.includes(x)) },
      },
    ],
  });
  const fixture = TestBed.createComponent(PatientDetail);
  fixture.componentRef.setInput('id', 'p1');
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PatientDetail', () => {
  it('lista os episódios do paciente', () => {
    const el = render(['NURSE']);
    expect(el.querySelector('.episode-list')?.textContent).toContain('Consulta externa');
    expect(el.querySelector('.episode-list')?.textContent).toContain('Concluído');
  });

  it('destaca as alergias e mostra o processo', () => {
    const el = render(['NURSE']);
    expect(el.querySelector('.allergy')?.textContent).toContain('Penicilina');
    expect(el.textContent).toContain('000001');
    expect(el.textContent).toContain('Luanda');
  });

  it('a enfermagem edita mas não inactiva nem vê o histórico', () => {
    const el = render(['NURSE']);
    const buttons = [...el.querySelectorAll('.header-actions > *')].map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons).toEqual(['Editar']);
  });

  it('o administrador pode inactivar e ver o histórico', () => {
    const el = render(['ADMIN']);
    const buttons = [...el.querySelectorAll('.header-actions > *')].map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons).toEqual(['Ver histórico', 'Inactivar', 'Editar']);
  });

  it('o gestor só consulta', () => {
    const el = render(['MANAGER']);
    const buttons = [...el.querySelectorAll('.header-actions > *')].map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons).toEqual(['Ver histórico']);
  });
});
