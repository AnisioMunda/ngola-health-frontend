import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { Attendance } from '../data/hr.model';
import { HrService } from '../data/hr.service';
import { HrHome } from './hr-home';

const open: Attendance = {
  id: 'a1',
  userId: 'u',
  userName: 'Ana',
  shiftId: 's',
  shiftStartsAt: '2026-11-16T07:00:00Z',
  shiftEndsAt: '2026-11-16T15:00:00Z',
  clockIn: '2026-11-16T07:12:00Z',
  clockOut: null,
  minutesWorked: null,
  lateMinutes: 12,
  overtimeMinutes: 0,
  correctedByName: null,
  correctionReason: null,
};

function render(roles: Role[], current: Attendance | null) {
  const service = {
    current: vi.fn().mockReturnValue(of(current)),
    myShifts: vi.fn().mockReturnValue(of([])),
    overview: vi.fn().mockReturnValue(
      of({
        onDutyNow: 3,
        shiftsToday: 5,
        absentToday: 1,
        lateToday: 0,
        pendingLeaves: 2,
        onLeaveToday: 1,
      }),
    ),
    daily: vi.fn().mockReturnValue(of([])),
    clockIn: vi.fn().mockReturnValue(of(open)),
    clockOut: vi
      .fn()
      .mockReturnValue(
        of({ ...open, clockOut: '2026-11-16T15:30:00Z', minutesWorked: 498, overtimeMinutes: 30 }),
      ),
  };
  TestBed.configureTestingModule({
    imports: [HrHome],
    providers: [
      provideRouter([]),
      { provide: HrService, useValue: service },
      {
        provide: AuthService,
        useValue: {
          hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(HrHome);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, service };
}

const button = (el: HTMLElement, text: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(text));

describe('HrHome', () => {
  it('regista a entrada e depois a saída com as horas trabalhadas', () => {
    const { el, fixture, service } = render(['NURSE'], null);
    button(el, 'Registar entrada')!.click();
    fixture.detectChanges();
    expect(service.clockIn).toHaveBeenCalled();
    expect(el.textContent).toContain('12 min de atraso');
    button(el, 'Registar saída')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('8h18 trabalhadas');
    expect(el.textContent).toContain('0h30 extra');
  });

  it('só os gestores vêem o painel e a assiduidade', () => {
    const nurse = render(['NURSE'], null);
    expect(nurse.service.overview).not.toHaveBeenCalled();
    expect(nurse.el.querySelector('.tiles')).toBeNull();
    TestBed.resetTestingModule();
    const manager = render(['MANAGER'], null);
    expect(manager.el.querySelectorAll('.tile').length).toBe(6);
    expect(manager.el.textContent).toContain('pedidos por decidir');
  });
});
