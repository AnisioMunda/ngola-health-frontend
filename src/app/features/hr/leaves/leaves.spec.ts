import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { Leave } from '../data/hr.model';
import { HrService } from '../data/hr.service';
import { Leaves } from './leaves';

const pending: Leave = {
  id: 'l1',
  userId: 'nurse',
  userName: 'Ana',
  type: 'VACATION',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
  days: 3,
  reason: null,
  status: 'PENDING',
  decidedByName: null,
  decidedAt: null,
  decisionNote: null,
  createdAt: '2026-11-16T10:00:00Z',
};

function render(roles: Role[], myId = 'manager') {
  const conflict = new HttpErrorResponse({
    status: 409,
    error: {
      code: 'LEAVE_SHIFT_CONFLICT',
      detail: 'O profissional tem 1 turno(s) marcado(s) neste período.',
    },
  });
  const service = {
    myLeaves: vi
      .fn()
      .mockReturnValue(of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })),
    leaves: vi
      .fn()
      .mockReturnValue(
        of({ content: [pending], page: 0, size: 20, totalElements: 1, totalPages: 1 }),
      ),
    decide: vi
      .fn()
      .mockReturnValueOnce(throwError(() => conflict))
      .mockReturnValue(of({ ...pending, status: 'APPROVED' })),
  };
  TestBed.configureTestingModule({
    imports: [Leaves],
    providers: [
      provideRouter([]),
      { provide: HrService, useValue: service },
      {
        provide: AuthService,
        useValue: {
          user: () => ({ id: myId, roles }),
          hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(Leaves);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, service };
}

const button = (el: HTMLElement, text: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(text));

describe('Leaves', () => {
  it('aprovar com turnos marcados pede confirmação e reenvia com cancelamento', () => {
    const { el, fixture, service } = render(['MANAGER']);
    button(el, 'Aprovar')!.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('turno(s) marcado(s)');
    button(el, 'Aprovar e cancelar os turnos')!.click();
    expect(service.decide).toHaveBeenLastCalledWith('l1', {
      approve: true,
      note: null,
      cancelConflictingShifts: true,
    });
  });

  it('o gestor não decide o próprio pedido', () => {
    const { el } = render(['MANAGER'], 'nurse');
    expect(button(el, 'Aprovar')).toBeUndefined();
    expect(el.textContent).toContain('O seu pedido');
  });

  it('quem não é gestor não vê pedidos de outros', () => {
    const { el, service } = render(['NURSE'], 'nurse');
    expect(service.leaves).not.toHaveBeenCalled();
    expect(el.textContent).not.toContain('Por decidir');
  });
});
