import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/auth/roles';
import { Shell } from '../../layout/shell/shell';
import { Home } from './home';

function setup(roles: Role[]) {
  TestBed.configureTestingModule({
    imports: [Home, Shell],
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          user: () => ({ fullName: 'Dr. Rui', roles, hospitalName: 'HCL' }),
          hasAnyRole: (allowed: readonly Role[]) => roles.some((r) => allowed.includes(r)),
          logout: () => ({ subscribe: () => undefined }),
        },
      },
    ],
  });
}

function tiles(): string[] {
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll('.tile strong')].map((t) =>
    t.textContent!.trim(),
  );
}

function menu(): string[] {
  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll('nav a')]
    .map((a) => a.textContent!.trim())
    .filter((label) => label !== 'Início');
}

describe('Home', () => {
  it('o médico vê o cartão de Prescrições', () => {
    setup(['DOCTOR']);
    expect(tiles()).toContain('Prescrições');
  });

  it.each<Role[]>([
    ['DOCTOR'],
    ['NURSE'],
    ['PHARMACIST'],
    ['RECEPTIONIST'],
    ['ADMIN'],
    ['MANAGER'],
    ['SUPER_ADMIN'],
    ['LAB_TECHNICIAN'],
  ])('cartões e menu coincidem para %s', (role) => {
    setup([role]);
    expect(tiles()).toEqual(menu());
  });

  it('perfil sem áreas vê a mensagem de espera', () => {
    setup(['PATIENT']);
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('ficarão disponíveis');
  });
});
