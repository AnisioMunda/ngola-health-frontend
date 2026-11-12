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
    links: [...el.querySelectorAll('nav a')].map((a) => a.textContent?.trim()),
    account: el.querySelector('.who')?.textContent ?? '',
    bell: el.querySelector('app-notification-bell'),
  };
}

describe('Shell', () => {
  it('o farmacêutico vê prescrições e farmácia', () => {
    expect(render(['PHARMACIST'], 'HCL').links).toEqual(['Início', 'Prescrições', 'Farmácia']);
  });

  it('quem trabalha num hospital tem o sino de notificações', () => {
    expect(render(['DOCTOR'], 'HCL').bell).not.toBeNull();
  });

  it('o administrador da plataforma vê hospitais e utilizadores', () => {
    const { links, account, bell } = render(['SUPER_ADMIN'], null);
    expect(bell).toBeNull();
    expect(links).toEqual(['Início', 'Hospitais', 'Utilizadores', 'Auditoria']);
    expect(account).toContain('Plataforma');
  });

  it('o administrador do hospital não vê hospitais', () => {
    const { links, account } = render(['ADMIN'], 'HCL');
    expect(links).toEqual([
      'Início',
      'Pacientes',
      'Triagem',
      'Episódios',
      'Prescrições',
      'Laboratório',
      'Farmácia',
      'Utilizadores',
      'Auditoria',
    ]);
    expect(account).toContain('Administrador · HCL');
  });

  it('o médico vê o início e as áreas clínicas', () => {
    expect(render(['DOCTOR'], 'HCL').links).toEqual([
      'Início',
      'Pacientes',
      'Triagem',
      'Episódios',
      'Prescrições',
      'Laboratório',
      'Farmácia',
    ]);
  });
});
