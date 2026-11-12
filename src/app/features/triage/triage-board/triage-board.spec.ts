import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { Triage } from '../data/triage.model';
import { TriageService } from '../data/triage.service';
import { TriageBoard } from './triage-board';

function t(partial: Partial<Triage>): Triage {
  return {
    id: 'x',
    queueDate: '2026-11-12',
    queueNumber: 1,
    patientId: null,
    patientRecordNumber: null,
    displayName: 'Desconhecido',
    identified: false,
    tempAge: null,
    tempGender: null,
    priority: 'GREEN',
    chiefComplaint: 'Dor',
    painScale: null,
    notes: null,
    vitals: null,
    status: 'WAITING',
    triagedAt: '2026-11-12T08:00:00Z',
    triagedByName: null,
    calledAt: null,
    calledByName: null,
    closedAt: null,
    closedByName: null,
    episodeId: null,
    waitingMinutes: 5,
    targetMinutes: 120,
    overdue: false,
    priorityChanges: [],
    version: 0,
    ...partial,
  };
}

function render(roles: Role[]) {
  const service = {
    queue: vi
      .fn()
      .mockReturnValue(
        of([
          t({
            id: 'a',
            queueNumber: 2,
            priority: 'RED',
            overdue: true,
            waitingMinutes: 3,
            targetMinutes: 0,
          }),
          t({
            id: 'b',
            queueNumber: 1,
            priority: 'GREEN',
            identified: true,
            displayName: 'Ana Silva',
          }),
          t({ id: 'c', queueNumber: 3, status: 'IN_PROGRESS', calledAt: '2026-11-12T08:10:00Z' }),
        ]),
      ),
    stats: vi.fn().mockReturnValue(
      of({
        day: '2026-11-12',
        triagedToday: 3,
        waiting: 2,
        inProgress: 1,
        overdue: 1,
        leftToday: 0,
        waitingByPriority: { RED: 1, ORANGE: 0, YELLOW: 0, GREEN: 1, BLUE: 0 },
        averageWaitMinutesToday: 10,
      }),
    ),
    call: vi.fn().mockReturnValue(of(t({}))),
    left: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [TriageBoard],
    providers: [
      provideRouter([]),
      { provide: TriageService, useValue: service },
      {
        provide: AuthService,
        useValue: { hasAnyRole: (r: Role[]) => roles.some((x) => r.includes(x)) },
      },
    ],
  });
  const fixture = TestBed.createComponent(TriageBoard);
  fixture.detectChanges();
  return { el: fixture.nativeElement as HTMLElement, service };
}

describe('TriageBoard', () => {
  it('separa em espera e em atendimento e assinala atrasos', () => {
    const { el } = render(['NURSE']);
    const waitingRows = el.querySelectorAll('.card:not(.in-progress) tbody tr');
    expect(waitingRows.length).toBe(2);
    expect(waitingRows[0].classList).toContain('overdue');
    expect(waitingRows[0].textContent).toContain('Vermelho');
    expect(waitingRows[0].textContent).toContain('Provisório');
    expect(waitingRows[1].textContent).not.toContain('Provisório');
    expect(el.querySelector('.in-progress')?.textContent).toContain('Em atendimento (1)');
    expect(el.querySelector('.stat.alarm')?.textContent).toContain('1');
  });

  it('a enfermagem chama; a recepção só marca saída', () => {
    const nurse = render(['NURSE']);
    expect(nurse.el.querySelector('tbody .btn-primary')?.textContent).toContain('Chamar');
    (nurse.el.querySelector('tbody .btn-primary') as HTMLButtonElement).click();
    expect(nurse.service.call).toHaveBeenCalledWith('a');

    TestBed.resetTestingModule();
    const reception = render(['RECEPTIONIST']);
    const buttons = [...reception.el.querySelectorAll('tbody tr:first-child button')].map((b) =>
      b.textContent?.trim(),
    );
    expect(buttons).toEqual(['Saiu']);
    expect(reception.el.querySelector('a.btn-primary')).toBeNull();
  });
});
