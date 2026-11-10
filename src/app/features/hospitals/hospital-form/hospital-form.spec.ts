import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Hospital } from '../data/hospital.model';
import { HospitalService } from '../data/hospital.service';
import { HospitalForm } from './hospital-form';

const HOSPITAL: Hospital = {
  id: 'h1',
  name: 'Hospital Central de Luanda',
  code: 'HCL-001',
  type: 'HOSPITAL',
  province: 'Luanda',
  municipality: 'Ingombota',
  address: null,
  phone: null,
  email: null,
  taxId: null,
  active: true,
  version: 3,
  createdAt: '2026-11-10T10:00:00Z',
  updatedAt: '2026-11-10T10:00:00Z',
};

describe('HospitalForm', () => {
  let service: Record<'findById' | 'create' | 'update', ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    service = { findById: vi.fn(), create: vi.fn(), update: vi.fn() };
    TestBed.configureTestingModule({
      imports: [HospitalForm],
      providers: [provideRouter([]), { provide: HospitalService, useValue: service }],
    });
  });

  function create(id?: string) {
    const fixture = TestBed.createComponent(HospitalForm);
    if (id) fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }

  function fillValid(form: HospitalForm['form']) {
    form.setValue({
      name: '  Clínica Girassol ',
      code: 'cgi-001',
      type: 'CLINIC',
      province: 'Luanda',
      municipality: ' ',
      address: '',
      phone: '+244 923 000 000',
      email: '',
      taxId: '',
    });
  }

  it('valida obrigatórios, código e campos opcionais', () => {
    const { form } = create().componentInstance;
    expect(form.valid).toBe(false);

    form.patchValue({ name: '   ', province: ' ', email: 'x', phone: 'abc', taxId: '12' });
    expect(form.controls.name.invalid).toBe(true);
    expect(form.controls.province.invalid).toBe(true);
    expect(form.controls.email.invalid).toBe(true);
    expect(form.controls.phone.invalid).toBe(true);
    expect(form.controls.taxId.invalid).toBe(true);

    form.controls.code.setValue('código inválido');
    expect(form.controls.code.invalid).toBe(true);
  });

  it('normaliza o código para maiúsculas', () => {
    const component = create().componentInstance;
    component.form.controls.code.setValue('hgl-001');
    component.normalizeCode();
    expect(component.form.controls.code.value).toBe('HGL-001');
  });

  it('não envia um formulário inválido', () => {
    const component = create().componentInstance;
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
    expect(component.form.controls.name.touched).toBe(true);
  });

  it('regista com dados limpos e volta à lista com aviso', async () => {
    service.create.mockReturnValue(of({ ...HOSPITAL, name: 'Clínica Girassol' }));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const component = create().componentInstance;
    fillValid(component.form);

    component.submit();

    expect(service.create).toHaveBeenCalledWith({
      name: 'Clínica Girassol',
      code: 'CGI-001',
      type: 'CLINIC',
      province: 'Luanda',
      municipality: null,
      address: null,
      phone: '+244 923 000 000',
      email: null,
      taxId: null,
      version: null,
    });
    expect(navigate).toHaveBeenCalledWith(['/hospitals'], {
      state: { notice: 'Clínica Girassol foi registado.' },
    });
  });

  it('na edição carrega o hospital e envia a versão lida', () => {
    service.findById.mockReturnValue(of(HOSPITAL));
    service.update.mockReturnValue(of(HOSPITAL));
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const component = create('h1').componentInstance;

    expect(service.findById).toHaveBeenCalledWith('h1');
    expect(component.form.controls.municipality.value).toBe('Ingombota');

    component.submit();
    expect(service.update).toHaveBeenCalledWith('h1', expect.objectContaining({ version: 3 }));
  });

  it('mostra erros do servidor no campo e na mensagem geral', () => {
    service.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              code: 'HOSPITAL_CODE_IN_USE',
              detail: 'Já existe um hospital com o código CGI-001.',
            },
          }),
      ),
    );
    const fixture = create();
    const component = fixture.componentInstance;
    fillValid(component.form);

    component.submit();
    fixture.detectChanges();

    expect(component.form.controls.code.errors).toEqual({
      server: 'Já existe um hospital com o código CGI-001.',
    });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('CGI-001');
    expect(el.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(false);
  });
});
