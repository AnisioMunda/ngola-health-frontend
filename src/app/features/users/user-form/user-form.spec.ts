import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/auth/roles';
import { HospitalService } from '../../hospitals/data/hospital.service';
import { User } from '../data/user.model';
import { UserService } from '../data/user.service';
import { UserForm } from './user-form';

const EXISTING: User = {
  id: 'u1',
  username: 'enf.ana',
  fullName: 'Ana',
  email: 'ana@x.ao',
  phone: null,
  specialty: null,
  professionalCardNumber: null,
  roles: ['NURSE'],
  hospitalId: 'h1',
  hospitalName: 'HCL',
  status: 'ACTIVE',
  mustChangePassword: false,
  lockedUntil: null,
  lastLoginAt: null,
  version: 4,
  createdAt: '',
  updatedAt: '',
};

describe('UserForm', () => {
  let users: Record<'findById' | 'create' | 'update' | 'resetPassword', ReturnType<typeof vi.fn>>;

  function setup(actorRoles: Role[]) {
    users = { findById: vi.fn(), create: vi.fn(), update: vi.fn(), resetPassword: vi.fn() };
    TestBed.configureTestingModule({
      imports: [UserForm],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: users },
        {
          provide: HospitalService,
          useValue: { findActive: () => of([{ id: 'h1', name: 'HCL' }]) },
        },
        {
          provide: AuthService,
          useValue: { hasAnyRole: (r: Role[]) => actorRoles.some((a) => r.includes(a)) },
        },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  }

  function create(id?: string) {
    const fixture = TestBed.createComponent(UserForm);
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }

  function fill(form: UserForm['form'], roles: Role[]) {
    form.patchValue({
      fullName: ' Rui Costa ',
      username: 'Rui.Costa',
      email: 'Rui@x.ao',
      roles,
    });
  }

  describe('como ADMIN', () => {
    beforeEach(() => setup(['ADMIN']));

    it('cria com senha temporária gerada e sem escolher hospital', () => {
      users.create.mockReturnValue(of(EXISTING));
      const c = create().componentInstance;
      expect(c.form.controls.temporaryPassword.valid).toBe(true);
      fill(c.form, ['DOCTOR']);
      c.submit();
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Rui Costa',
          username: 'rui.costa',
          email: 'Rui@x.ao',
          roles: ['DOCTOR'],
          hospitalId: null,
          temporaryPassword: c.form.controls.temporaryPassword.value,
        }),
      );
    });

    it('não oferece o perfil de administrador da plataforma', () => {
      const el = create().nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('Administrador da plataforma');
    });

    it('na edição envia a versão e não envia nome de utilizador nem senha', () => {
      users.findById.mockReturnValue(of(EXISTING));
      users.update.mockReturnValue(of(EXISTING));
      const c = create('u1').componentInstance;
      expect(c.form.controls.username.disabled).toBe(true);
      c.submit();
      const [id, body] = users.update.mock.calls[0];
      expect(id).toBe('u1');
      expect(body.version).toBe(4);
      expect(body).not.toHaveProperty('username');
      expect(body).not.toHaveProperty('temporaryPassword');
    });
  });

  describe('como SUPER_ADMIN', () => {
    beforeEach(() => setup(['SUPER_ADMIN']));

    it('exige hospital para perfis de hospital', () => {
      const c = create().componentInstance;
      fill(c.form, ['NURSE']);
      c.submit();
      expect(users.create).not.toHaveBeenCalled();
      expect(c.form.controls.hospitalId.hasError('required')).toBe(true);
    });

    it('o perfil SUPER_ADMIN é exclusivo e dispensa hospital', () => {
      users.create.mockReturnValue(of(EXISTING));
      const fixture = create();
      const c = fixture.componentInstance as unknown as {
        toggleRole(r: Role, checked: boolean): void;
      } & UserForm;
      fill(c.form, ['NURSE']);
      c.toggleRole('SUPER_ADMIN', true);
      expect(c.form.controls.roles.value).toEqual(['SUPER_ADMIN']);
      c.toggleRole('DOCTOR', true);
      expect(c.form.controls.roles.value).toEqual(['DOCTOR']);
      c.toggleRole('SUPER_ADMIN', true);
      c.submit();
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['SUPER_ADMIN'], hospitalId: null }),
      );
    });
  });
});
