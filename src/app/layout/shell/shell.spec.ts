import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { AuthUser } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/auth/roles';
import { NotificationService } from '../../features/notifications/data/notification.service';
import { Shell } from './shell';

function render(roles: Role[], hospitalName: string | null) {
  const user: AuthUser = {
    id: '1',
    username: 'x',
    fullName: 'Ana Silva',
    email: 'a@x.ao',
    roles,
    hospitalId: hospitalName ? 'h' : null,
    hospitalName,
    mustChangePassword: false,
  };
  TestBed.configureTestingModule({
    imports: [Shell],
    providers: [
      provideRouter([]),
      {
        provide: NotificationService,
        useValue: { unread: signal(2).asReadonly(), refreshCount: () => of({ count: 2 }) },
      },
      {
        provide: AuthService,
        useValue: {
          user: () => user,
          hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return {
    links: [...el.querySelectorAll('.sidebar__nav a')].map((a) => a.textContent?.trim()),
    account: el.querySelector('.who')?.textContent ?? '',
    roleIcons: [...el.querySelectorAll<SVGElement>('.who__role-icons svg')].map((icon) =>
      icon.getAttribute('data-role-icon'),
    ),
    actionIcons: [...el.querySelectorAll<HTMLElement>('.account__action')].map((action) =>
      action.firstElementChild?.tagName.toLowerCase(),
    ),
    bell: el.querySelector('app-notification-bell'),
    toggle: el.querySelector<HTMLButtonElement>('.sidebar__toggle'),
    shell: el.querySelector<HTMLElement>('.app-shell'),
    fixture,
  };
}

describe('Shell', () => {
  it('mostra o primeiro módulo acessível sem incluir Início', () => {
    expect(render(['PHARMACIST'], 'HCL').links).toEqual([
      'Prescrições',
      'Farmácia',
      'Recursos humanos',
      'Equipamentos',
    ]);
  });

  it('o farmacêutico vê prescrições e farmácia', () => {
    expect(render(['PHARMACIST'], 'HCL').links).toEqual([
      'Prescrições',
      'Farmácia',
      'Recursos humanos',
      'Equipamentos',
    ]);
  });

  it('quem trabalha num hospital tem o sino de notificações', () => {
    expect(render(['DOCTOR'], 'HCL').bell).not.toBeNull();
  });

  it.each([
    ['DOCTOR', 'DOCTOR'],
    ['NURSE', 'NURSE'],
    ['PHARMACIST', 'PHARMACIST'],
    ['LAB_TECHNICIAN', 'LAB_TECHNICIAN'],
    ['RECEPTIONIST', 'RECEPTIONIST'],
    ['FINANCIAL', 'FINANCIAL'],
    ['MANAGER', 'MANAGER'],
    ['ADMIN', 'ADMIN'],
    ['SUPER_ADMIN', 'SUPER_ADMIN'],
  ] as const)('mostra o ícone específico para %s', (role, icon) => {
    expect(render([role], 'HCL').roleIcons).toEqual([icon]);
  });

  it('mostra um ícone para cada perfil e ícones nos controlos da conta', () => {
    const { roleIcons, actionIcons } = render(['DOCTOR', 'MANAGER'], 'HCL');
    expect(roleIcons).toEqual(['DOCTOR', 'MANAGER']);
    expect(actionIcons).toEqual(['svg', 'svg']);
  });

  it('o administrador da plataforma vê hospitais e utilizadores', () => {
    const { links, account, bell } = render(['SUPER_ADMIN'], null);
    expect(bell).toBeNull();
    expect(links).toEqual(['Hospitais', 'Utilizadores', 'Auditoria', 'Estado do sistema']);
    expect(account).toContain('Plataforma');
  });

  it('o administrador do hospital não vê hospitais', () => {
    const { links, account } = render(['ADMIN'], 'HCL');
    expect(links).toEqual([
      'Dashboard',
      'Relatórios',
      'Pacientes',
      'Agendamento',
      'Triagem',
      'Episódios',
      'Internamento',
      'Prescrições',
      'Laboratório',
      'Farmácia',
      'Recursos humanos',
      'Equipamentos',
      'Utilizadores',
      'Auditoria',
    ]);
    expect(account).toContain('Administrador · HCL');
  });

  it('o médico vê o início e as áreas clínicas', () => {
    expect(render(['DOCTOR'], 'HCL').links).toEqual([
      'Pacientes',
      'Agendamento',
      'Triagem',
      'Episódios',
      'Internamento',
      'Prescrições',
      'Laboratório',
      'Farmácia',
      'Recursos humanos',
      'Equipamentos',
    ]);
  });

  it('permite recolher e expandir o menu lateral', () => {
    const { toggle, shell, fixture } = render(['DOCTOR'], 'HCL');
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    toggle?.click();
    fixture.detectChanges();
    expect(shell?.classList.contains('app-shell--collapsed')).toBe(true);
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });
});
