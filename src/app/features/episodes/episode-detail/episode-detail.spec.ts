import { registerLocaleData } from '@angular/common';
import localePtAo from '@angular/common/locales/pt-AO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { Episode, EpisodeStatus } from '../data/episode.model';
import { LabService } from '../../laboratory/data/lab.service';
import { PrescriptionService } from '../../prescriptions/data/prescription.service';
import { EpisodeService } from '../data/episode.service';
import { EpisodeDetail } from './episode-detail';

function episode(status: EpisodeStatus, extra: Partial<Episode> = {}): Episode {
  return {
    id: 'e1',
    patientId: 'p1',
    patientName: 'Ana Silva',
    patientRecordNumber: '000001',
    type: 'OUTPATIENT',
    status,
    scheduledAt: '2026-11-10T09:00:00Z',
    reason: 'Febre',
    doctorId: null,
    doctorName: null,
    symptoms: null,
    diagnosis: null,
    clinicalNotes: null,
    vitals: null,
    startedAt: null,
    startedByName: null,
    completedAt: null,
    completedByName: null,
    cancelledAt: null,
    cancelledByName: null,
    cancellationReason: null,
    version: 3,
    createdAt: '',
    updatedAt: '',
    ...extra,
  };
}

registerLocaleData(localePtAo);

describe('EpisodeDetail', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;

  function render(roles: Role[], status: EpisodeStatus, extra: Partial<Episode> = {}) {
    service = {
      view: vi.fn().mockReturnValue(of(episode(status, extra))),
      doctors: vi.fn().mockReturnValue(of([])),
      start: vi.fn().mockReturnValue(of(episode('IN_PROGRESS'))),
      recordVitals: vi.fn().mockReturnValue(of(episode('IN_PROGRESS'))),
      complete: vi.fn(),
      cancel: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [EpisodeDetail],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-AO' },
        { provide: EpisodeService, useValue: service },
        { provide: PrescriptionService, useValue: { byEpisode: () => of([]) } },
        { provide: LabService, useValue: { byEpisode: () => of([]) } },
        {
          provide: AuthService,
          useValue: { hasAnyRole: (r: Role[]) => roles.some((x) => r.includes(x)) },
        },
      ],
    });
    const fixture = TestBed.createComponent(EpisodeDetail);
    fixture.componentRef.setInput('id', 'e1');
    fixture.detectChanges();
    return fixture;
  }

  function actions(fixture: ReturnType<typeof render>): string[] {
    const el = fixture.nativeElement as HTMLElement;
    return [...el.querySelectorAll('.header-actions button')].map((b) => b.textContent!.trim());
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('recepção: agendado → só pode cancelar', () => {
    expect(actions(render(['RECEPTIONIST'], 'SCHEDULED'))).toEqual(['Cancelar episódio']);
  });

  it('enfermagem: agendado → pode iniciar; em curso → regista vitais mas não conclui', () => {
    const scheduled = render(['NURSE'], 'SCHEDULED');
    expect(actions(scheduled)).toContain('Iniciar');
    TestBed.resetTestingModule();
    const inProgress = render(['NURSE'], 'IN_PROGRESS');
    expect(actions(inProgress)).toEqual([]);
    const el = inProgress.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Registar');
  });

  it('médico em curso pode prescrever', () => {
    const fixture = render(['DOCTOR'], 'IN_PROGRESS');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Prescrições');
    expect([...el.querySelectorAll('a')].some((a) => a.textContent?.trim() === 'Prescrever')).toBe(
      true,
    );
  });

  it('médico em curso: conclui e cancela', () => {
    expect(actions(render(['DOCTOR'], 'IN_PROGRESS'))).toEqual(['Cancelar episódio', 'Concluir']);
  });

  it('episódio concluído fica sem acções de edição', () => {
    const fixture = render(['DOCTOR'], 'COMPLETED', { diagnosis: 'Malária' });
    expect(actions(fixture)).toEqual([]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.section-head button').length).toBe(0);
    expect(el.textContent).toContain('Malária');
  });

  it('envia os sinais vitais com a versão lida', () => {
    const fixture = render(['NURSE'], 'IN_PROGRESS');
    const c = fixture.componentInstance;
    c.vitalsForm.patchValue({ systolicBp: 120, diastolicBp: 80 });
    c.saveVitals();
    expect(service['recordVitals']).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({ systolicBp: 120, diastolicBp: 80, heartRate: null }),
      3,
    );
  });

  it('não envia sinais vitais fora dos limites', () => {
    const c = render(['NURSE'], 'IN_PROGRESS').componentInstance;
    c.vitalsForm.patchValue({ temperature: 368 });
    c.saveVitals();
    expect(service['recordVitals']).not.toHaveBeenCalled();
  });

  it('mostra IMC quando há peso e altura', () => {
    const fixture = render(['DOCTOR'], 'IN_PROGRESS', {
      vitals: {
        systolicBp: null,
        diastolicBp: null,
        heartRate: null,
        respiratoryRate: null,
        temperature: null,
        oxygenSaturation: null,
        weightKg: 70,
        heightCm: 175,
        recordedAt: '2026-11-10T09:10:00Z',
        recordedByName: 'Enf. Ana',
      },
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('22,9');
  });
});
