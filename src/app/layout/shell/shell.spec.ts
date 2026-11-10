import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { AuthUser } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/auth/roles';
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
  };
}

describe('Shell', () => {
  it('o administrador da plataforma vê hospitais e utilizadores', () => {
    const { links, account } = render(['SUPER_ADMIN'], null);
    expect(links).toEqual(['Início', 'Hospitais', 'Utilizadores']);
    expect(account).toContain('Plataforma');
  });

  it('o administrador do hospital não vê hospitais', () => {
    const { links, account } = render(['ADMIN'], 'HCL');
    expect(links).toEqual(['Início', 'Utilizadores']);
    expect(account).toContain('Administrador · HCL');
  });

  it('o médico só vê o início', () => {
    expect(render(['DOCTOR'], 'HCL').links).toEqual(['Início']);
  });
});
