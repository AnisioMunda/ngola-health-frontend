import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { SystemStatusService } from '../../../core/system/system-status.service';
import { Login } from './login';

describe('Login', () => {
  let login: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    login = vi.fn();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
        { provide: SystemStatusService, useValue: { checkBackend: () => of('UP') } },
      ],
    });
    const router = TestBed.inject(Router);
    navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  function create(returnUrl?: string) {
    const fixture = TestBed.createComponent(Login);
    if (returnUrl) fixture.componentRef.setInput('returnUrl', returnUrl);
    fixture.detectChanges();
    return fixture;
  }

  it('entra e volta à rota pedida', () => {
    login.mockReturnValue(of({ mustChangePassword: false }));
    const { componentInstance: c } = create('/users');
    c.form.setValue({ login: ' ana ', password: 'Senha-2026x' });
    c.submit();
    expect(login).toHaveBeenCalledWith('ana', 'Senha-2026x');
    expect(navigateByUrl).toHaveBeenCalledWith('/users');
  });

  it('com senha temporária vai para a troca de senha', () => {
    login.mockReturnValue(of({ mustChangePassword: true }));
    const { componentInstance: c } = create('/users');
    c.form.setValue({ login: 'ana', password: 'x' });
    c.submit();
    expect(navigate).toHaveBeenCalledWith(['/change-password'], {
      queryParams: { returnUrl: '/users' },
    });
  });

  it('mostra a mensagem do servidor e limpa a senha', () => {
    login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { code: 'INVALID_CREDENTIALS', detail: 'Utilizador ou senha incorrectos.' },
          }),
      ),
    );
    const fixture = create();
    fixture.componentInstance.form.setValue({ login: 'ana', password: 'errada' });
    fixture.componentInstance.submit();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('incorrectos');
    expect(fixture.componentInstance.form.controls.password.value).toBe('');
  });

  it('não envia o formulário vazio', () => {
    create().componentInstance.submit();
    expect(login).not.toHaveBeenCalled();
  });
});
