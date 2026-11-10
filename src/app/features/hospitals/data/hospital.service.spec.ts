import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HospitalService } from './hospital.service';

describe('HospitalService', () => {
  let service: HospitalService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HospitalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envia só os filtros preenchidos na pesquisa', () => {
    service.search({ search: '  beng ', active: false, page: 2, size: 20 }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/hospitals/management');
    expect(req.request.params.get('search')).toBe('beng');
    expect(req.request.params.get('active')).toBe('false');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ content: [], page: 2, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('omite pesquisa vazia e estado "todos"', () => {
    service.search({ search: '   ' }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/hospitals/management');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('activa e desactiva com PATCH', () => {
    service.setActive('abc', false).subscribe();
    http.expectOne({ method: 'PATCH', url: '/api/hospitals/abc/deactivate' }).flush({});
    service.setActive('abc', true).subscribe();
    http.expectOne({ method: 'PATCH', url: '/api/hospitals/abc/activate' }).flush({});
  });
});
