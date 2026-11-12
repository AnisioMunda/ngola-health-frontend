import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { EpisodeService } from '../../episodes/data/episode.service';
import { PatientService } from '../../patients/data/patient.service';
import { Triage, TriageStatus } from '../data/triage.model';
import { TriageService } from '../data/triage.service';
import { TriageDetail } from './triage-detail';

function record(status: TriageStatus, identified: boolean): Triage {
  return {
    id: 't1',
    queueDate: '2026-11-12',
    queueNumber: 4,
    patientId: identified ? 'p1' : null,
    patientRecordNumber: identified ? '000001' : null,
    displayName: identified ? 'Ana Silva' : 'Desconhecido',
    identified,
    tempAge: identified ? null : 40,
    tempGender: null,
    priority: 'YELLOW',
    chiefComplaint: 'Dor',
    painScale: 5,
    notes: null,
    vitals: null,
    status,
    triagedAt: '2026-11-12T08:00:00Z',
    triagedByName: 'Enf. Ana',
    calledAt: null,
    calledByName: null,
    closedAt: null,
    closedByName: null,
    episodeId: null,
    waitingMinutes: 12,
    targetMinutes: 60,
    overdue: false,
    priorityChanges: [
      {
        from: 'GREEN',
        to: 'YELLOW',
        reason: 'Febre alta',
        changedByName: 'Enf. Ana',
        changedAt: '2026-11-12T08:05:00Z',
      },
    ],
    version: 1,
  };
}

function render(roles: Role[], status: TriageStatus, identified: boolean) {
  const triage = {
    view: vi.fn().mockReturnValue(of(record(status, identified))),
    changePriority: vi.fn().mockReturnValue(of(record(status, identified))),
    openEpisode: vi.fn().mockReturnValue(of({ ...record('COMPLETED', true), episodeId: 'e9' })),
  };
  TestBed.configureTestingModule({
    imports: [TriageDetail],
    providers: [
      provideRouter([]),
      { provide: TriageService, useValue: triage },
      { provide: EpisodeService, useValue: { doctors: () => of([]) } },
      { provide: PatientService, useValue: { search: vi.fn() } },
      {
        provide: AuthService,
        useValue: { hasAnyRole: (r: Role[]) => roles.some((x) => r.includes(x)) },
      },
    ],
  });
  const fixture = TestBed.createComponent(TriageDetail);
  fixture.componentRef.setInput('id', 't1');
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, triage };
}

describe('TriageDetail', () => {
  it('mostra o histórico de re-triagem e permite identificar o doente provisório', () => {
    const { el } = render(['NURSE'], 'WAITING', false);
    expect(el.querySelector('.history')?.textContent).toContain('Febre alta');
    expect(el.textContent).toContain('Identificar doente');
    expect(el.querySelector('app-patient-picker')).not.toBeNull();
  });

  it('a re-triagem exige motivo', () => {
    const { fixture, triage } = render(['NURSE'], 'WAITING', true);
    const c = fixture.componentInstance as unknown as {
      newPriority: string;
      reason: string;
      saveRetriage(): void;
    };
    c.newPriority = 'RED';
    c.reason = ' ';
    c.saveRetriage();
    expect(triage.changePriority).not.toHaveBeenCalled();
    c.reason = 'Dessaturação';
    c.saveRetriage();
    expect(triage.changePriority).toHaveBeenCalledWith('t1', 'RED', 'Dessaturação');
  });

  it('em atendimento sem identificação não deixa abrir episódio', () => {
    const { el } = render(['NURSE'], 'IN_PROGRESS', false);
    const open = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Abrir episódio'),
    );
    expect(open?.disabled).toBe(true);
  });

  it('identificado e em atendimento: abre episódio e mostra a ligação', () => {
    const { fixture, el, triage } = render(['DOCTOR'], 'IN_PROGRESS', true);
    fixture.componentInstance.openEpisode();
    fixture.detectChanges();
    expect(triage.openEpisode).toHaveBeenCalledWith('t1', null);
    expect(el.textContent).toContain('Encaminhado para episódio');
  });

  it('o gestor só consulta', () => {
    const { el } = render(['MANAGER'], 'WAITING', false);
    expect(el.querySelectorAll('.header-actions button').length).toBe(0);
    expect(el.textContent).not.toContain('Identificar doente');
  });
});
