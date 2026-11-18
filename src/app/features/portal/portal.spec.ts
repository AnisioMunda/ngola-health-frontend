import { registerLocaleData } from '@angular/common';
import localePtAo from '@angular/common/locales/pt-AO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { patientGuard, staffGuard } from '../../core/auth/auth.guards';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/auth/roles';
import { PortalAccessCard } from './access-card/portal-access-card';
import { Activate } from './activate/activate';
import { ResultRow } from './components/result-row';
import { PortalService } from './data/portal.service';
import { PortalHome } from './home/home';

registerLocaleData(localePtAo);

function auth(roles: Role[]) {
  return {
    user: () => ({ id: 'u', fullName: 'Ana Silva', roles, mustChangePassword: false }),
    hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
  };
}

describe('Guards do portal', () => {
  function run(guard: typeof staffGuard, roles: Role[]) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth(roles) }],
    });
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;
  }

  it('contas de doente vão para o portal; o pessoal não entra no portal', () => {
    expect(run(staffGuard, ['PATIENT'])).toBe('/portal');
    TestBed.resetTestingModule();
    expect(run(staffGuard, ['NURSE'])).toBe(true);
    TestBed.resetTestingModule();
    expect(run(patientGuard, ['NURSE'])).toBe('/');
    TestBed.resetTestingModule();
    expect(run(patientGuard, ['PATIENT'])).toBe(true);
  });
});

describe('Activate', () => {
  function render() {
    const service = { activate: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({
      imports: [Activate],
      providers: [provideRouter([]), { provide: PortalService, useValue: service }],
    });
    const fixture = TestBed.createComponent(Activate);
    fixture.detectChanges();
    return { fixture, service, el: fixture.nativeElement as HTMLElement };
  }

  it('não envia com senhas diferentes; activa com dados correctos', () => {
    const { fixture, service, el } = render();
    const form = fixture.componentInstance['form'];
    form.setValue({
      code: 'k7m2q-9xpr4',
      birthDate: '1990-05-01',
      username: 'ana.portal',
      email: 'ana@exemplo.ao',
      password: 'Senha-Forte-2026',
      confirm: 'Outra-Senha-2026',
    });
    fixture.componentInstance['submit']();
    fixture.detectChanges();
    expect(service.activate).not.toHaveBeenCalled();
    expect(el.textContent).toContain('As senhas não coincidem');
    form.controls.confirm.setValue('Senha-Forte-2026');
    fixture.componentInstance['submit']();
    fixture.detectChanges();
    expect(service.activate).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'k7m2q-9xpr4', username: 'ana.portal' }),
    );
    expect(el.textContent).toContain('Conta activada');
  });
});

describe('PortalAccessCard', () => {
  function render(roles: Role[], hasAccount = false) {
    const service = {
      status: vi.fn().mockReturnValue(
        of({
          hasAccount,
          accountActive: hasAccount,
          username: hasAccount ? 'ana.portal' : null,
          email: null,
          lastLoginAt: null,
          pendingCodeExpiresAt: null,
        }),
      ),
      issueCode: vi
        .fn()
        .mockReturnValue(of({ code: 'K7M2Q-9XPR4', expiresAt: '2026-11-21T10:00:00Z' })),
      setActive: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [PortalAccessCard],
      providers: [
        { provide: PortalService, useValue: service },
        { provide: AuthService, useValue: auth(roles) },
      ],
    });
    const fixture = TestBed.createComponent(PortalAccessCard);
    fixture.componentRef.setInput('patientId', 'p1');
    fixture.detectChanges();
    return { fixture, service, el: fixture.nativeElement as HTMLElement };
  }

  it('a recepção gera o código, que aparece uma vez em destaque', () => {
    const { fixture, service, el } = render(['RECEPTIONIST']);
    expect(el.textContent).toContain('Confirme a identidade');
    [...el.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Gerar código'))!
      .click();
    fixture.detectChanges();
    expect(service.issueCode).toHaveBeenCalledWith('p1');
    expect(el.querySelector('.code')?.textContent).toBe('K7M2Q-9XPR4');
  });

  it('só o administrador desactiva uma conta existente', () => {
    expect(render(['RECEPTIONIST'], true).el.textContent).not.toContain('Desactivar acesso');
    TestBed.resetTestingModule();
    expect(render(['ADMIN'], true).el.textContent).toContain('Desactivar acesso');
  });
});

describe('PortalHome e ResultRow', () => {
  it('mostra a próxima consulta, o valor por pagar e destaca resultados alterados', () => {
    const service = {
      me: vi.fn().mockReturnValue(
        of({
          fullName: 'Ana Silva',
          recordNumber: '000001',
          birthDate: '1990-05-01',
          hospitalName: 'HCL',
          phone: null,
          email: null,
        }),
      ),
      appointments: vi.fn().mockReturnValue(
        of([
          {
            id: 'a2',
            date: '2099-02-01',
            startTime: '10:00:00',
            endTime: '10:30:00',
            doctorName: 'Dr. Rui',
            type: 'CONSULTATION',
            status: 'SCHEDULED',
            reason: 'Controlo',
            cancellable: true,
          },
          {
            id: 'a1',
            date: '2099-01-10',
            startTime: '09:00:00',
            endTime: '09:30:00',
            doctorName: 'Dra. Eva',
            type: 'FOLLOW_UP',
            status: 'CONFIRMED',
            reason: 'Revisão',
            cancellable: true,
          },
        ]),
      ),
      labResults: vi.fn().mockReturnValue(
        of([
          {
            id: 'l1',
            number: 'LAB-2026-000001',
            requestedAt: '2026-11-10T10:00:00Z',
            requestedByName: 'Dr. Rui',
            status: 'IN_ANALYSIS',
            pending: 1,
            results: [
              {
                testName: 'Hemoglobina',
                value: '10.5',
                unit: 'g/dL',
                reference: '12–16',
                flag: 'LOW',
                validatedAt: '2026-11-10T12:00:00Z',
              },
            ],
          },
        ]),
      ),
      prescriptions: vi.fn().mockReturnValue(of([])),
    };
    TestBed.configureTestingModule({
      imports: [PortalHome, ResultRow],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-AO' },
        { provide: PortalService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(PortalHome);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Olá, Ana');
    expect(el.querySelector('app-appointment-card')?.textContent).toContain('Dra. Eva');
    expect(el.textContent).toContain('Abaixo da referência');
    expect(el.textContent).toContain('1 exame(s) ainda por concluir');
    expect(el.textContent).not.toContain('Por pagar');
  });
});
