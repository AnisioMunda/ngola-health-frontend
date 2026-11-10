import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Page } from '../../../core/http/page';
import { Hospital } from '../data/hospital.model';
import { HospitalService } from '../data/hospital.service';
import { HospitalList } from './hospital-list';

function hospital(overrides: Partial<Hospital> = {}): Hospital {
  return {
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
    version: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function page(content: Hospital[], totalPages = 1): Page<Hospital> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages };
}

describe('HospitalList', () => {
  let service: Record<'search' | 'setActive', ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    service = { search: vi.fn(), setActive: vi.fn() };
    TestBed.configureTestingModule({
      imports: [HospitalList],
      providers: [provideRouter([]), { provide: HospitalService, useValue: service }],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function render() {
    const fixture = TestBed.createComponent(HospitalList);
    fixture.detectChanges();
    return fixture;
  }

  it('lista hospitais com tipo e estado traduzidos', () => {
    service.search.mockReturnValue(
      of(
        page([
          hospital(),
          hospital({ id: 'h2', name: 'Clínica X', type: 'CLINIC', active: false }),
        ]),
      ),
    );
    const el = render().nativeElement as HTMLElement;

    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Hospital Central de Luanda');
    expect(rows[0].textContent).toContain('Ingombota, Luanda');
    expect(rows[0].textContent).toContain('Activo');
    expect(rows[1].textContent).toContain('Clínica');
    expect(rows[1].textContent).toContain('Inactivo');
    expect(service.search).toHaveBeenCalledWith({
      search: '',
      active: undefined,
      page: 0,
      size: 20,
    });
  });

  it('mostra a mensagem de erro do backend', () => {
    service.search.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: {
              code: 'UNAUTHENTICATED',
              detail: 'É necessário iniciar sessão para aceder a este recurso.',
            },
          }),
      ),
    );
    const el = render().nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('iniciar sessão');
  });

  it('desactiva após confirmação e actualiza a linha', () => {
    service.search.mockReturnValue(of(page([hospital()])));
    service.setActive.mockReturnValue(of(hospital({ active: false })));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('button.btn-danger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.setActive).toHaveBeenCalledWith('h1', false);
    expect(el.querySelector('tbody tr')?.textContent).toContain('Inactivo');
    expect(el.querySelector('.alert-success')?.textContent).toContain('foi desactivado');
  });

  it('não desactiva se o utilizador cancelar', () => {
    service.search.mockReturnValue(of(page([hospital()])));
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const el = render().nativeElement as HTMLElement;

    (el.querySelector('button.btn-danger') as HTMLButtonElement).click();

    expect(service.setActive).not.toHaveBeenCalled();
  });

  it('mostra paginação quando há várias páginas', () => {
    service.search.mockReturnValue(of(page([hospital()], 3)));
    const el = render().nativeElement as HTMLElement;
    expect(el.querySelector('.pagination')?.textContent).toContain('Página 1 de 3');
  });
});
