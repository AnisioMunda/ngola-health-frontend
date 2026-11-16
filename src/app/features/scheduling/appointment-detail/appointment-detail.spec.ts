import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { EpisodeService } from '../../episodes/data/episode.service';
import { Appointment, AppointmentStatus, isoDate } from '../data/scheduling.model';
import { SchedulingService } from '../data/scheduling.service';
import { AppointmentDetail } from './appointment-detail';

function appointment(status: AppointmentStatus, date: string): Appointment {
  return {
    id: 'a1',
    patientId: 'p1',
    patientName: 'Ana Silva',
    patientRecordNumber: '000001',
    patientPhone: '923000000',
    doctorId: 'd1',
    doctorName: 'Dr. Rui',
    type: 'CONSULTATION',
    date,
    startTime: '23:59:00',
    endTime: '23:59:59',
    slotPosition: 1,
    status,
    reason: 'Controlo',
    notes: null,
    bookedByName: 'Recepção',
    bookedAt: '2026-11-10T10:00:00Z',
    confirmedAt: null,
    checkedInAt: null,
    episodeId: null,
    noShowAt: null,
    cancelledAt: null,
    cancelledByName: null,
    cancellationReason: null,
    rescheduledFromId: null,
    rescheduledToId: null,
    version: 0,
  };
}

function render(roles: Role[], a: Appointment) {
  const service = {
    appointment: vi.fn().mockReturnValue(of(a)),
    checkIn: vi.fn().mockReturnValue(of({ ...a, status: 'CHECKED_IN', episodeId: 'e1' })),
    confirm: vi.fn().mockReturnValue(of({ ...a, status: 'CONFIRMED' })),
    availability: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [AppointmentDetail],
    providers: [
      provideRouter([]),
      { provide: SchedulingService, useValue: service },
      { provide: EpisodeService, useValue: { doctors: () => of([]) } },
      {
        provide: AuthService,
        useValue: {
          user: () => ({ id: 'u', roles }),
          hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AppointmentDetail);
  fixture.componentRef.setInput('id', 'a1');
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const buttons = () =>
    [...el.querySelectorAll<HTMLButtonElement>('.header-actions button')].map((b) =>
      b.textContent?.trim(),
    );
  return { fixture, el, service, buttons };
}

describe('AppointmentDetail', () => {
  const today = isoDate(new Date());

  it('no dia da marcação a recepção pode registar a chegada', () => {
    const { buttons } = render(['RECEPTIONIST'], appointment('SCHEDULED', today));
    expect(buttons()).toEqual(['Confirmar', 'Registar chegada', 'Remarcar', 'Cancelar']);
  });

  it('noutro dia não há chegada nem falta', () => {
    const { buttons } = render(['RECEPTIONIST'], appointment('CONFIRMED', '2099-01-05'));
    expect(buttons()).toEqual(['Remarcar', 'Cancelar']);
  });

  it('a chegada abre o episódio e mostra a ligação', () => {
    const { el, fixture, service } = render(['NURSE'], appointment('SCHEDULED', today));
    [...el.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Registar chegada'))!
      .click();
    fixture.detectChanges();
    expect(service.checkIn).toHaveBeenCalledWith('a1');
    expect(el.textContent).toContain('o episódio foi aberto');
    expect(el.querySelector('.header-actions')).toBeNull();
  });

  it('quem só consulta não vê acções', () => {
    const { el } = render(['MANAGER'], appointment('SCHEDULED', today));
    expect(el.querySelector('.header-actions')).toBeNull();
  });
});
