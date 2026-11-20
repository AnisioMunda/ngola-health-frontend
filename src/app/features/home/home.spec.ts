import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/auth/roles';
import { Home } from './home';

function render(roles: Role[]) {
  TestBed.configureTestingModule({
    imports: [Home],
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          user: () => ({ fullName: 'Dr. Rui', roles, hospitalName: 'HCL' }),
          hasAnyRole: (allowed: readonly Role[]) => roles.some((role) => allowed.includes(role)),
        },
      },
    ],
  });
  const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  return { fixture, navigateByUrl };
}

describe('Home', () => {
  it('encaminha o médico para o primeiro módulo permitido', () => {
    const { navigateByUrl } = render(['DOCTOR']);
    expect(navigateByUrl).toHaveBeenCalledWith('/patients', { replaceUrl: true });
  });

  it('encaminha o super administrador para o primeiro módulo permitido', () => {
    const { navigateByUrl } = render(['SUPER_ADMIN']);
    expect(navigateByUrl).toHaveBeenCalledWith('/hospitals', { replaceUrl: true });
  });

  it('mostra um estado vazio quando o perfil não tem módulos', () => {
    const { fixture, navigateByUrl } = render(['PATIENT']);
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Os módulos do seu perfil ainda não estão disponíveis.',
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('.tile')).toBeNull();
  });
});
