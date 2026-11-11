import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { HospitalService } from '../../hospitals/data/hospital.service';
import { AuditEvent } from '../data/audit.model';
import { AuditService } from '../data/audit.service';
import { AuditList } from './audit-list';

const EVENT: AuditEvent = {
  id: 'e1',
  occurredAt: '2026-11-10T10:00:00Z',
  hospitalId: 'h1',
  actorId: 'u1',
  actorUsername: 'admin.a',
  actorName: 'Ana Admin',
  action: 'UPDATE',
  entityType: 'USER',
  entityId: 'u2',
  summary: 'Utilizador editado: Rui (enf.rui)',
  changes: { fullName: { from: 'Rui', to: 'Rui Costa' } },
  outcome: 'SUCCESS',
  ipAddress: '10.0.0.1',
  userAgent: 'Firefox',
  requestMethod: 'PUT',
  requestPath: '/api/users/u2',
  requestId: 'r1',
};

describe('AuditList', () => {
  let search: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    search = vi.fn().mockReturnValue(
      of({
        content: [
          EVENT,
          { ...EVENT, id: 'e2', action: 'LOGIN_FAILED', outcome: 'FAILURE', changes: null },
        ],
        page: 0,
        size: 50,
        totalElements: 2,
        totalPages: 1,
      }),
    );
    TestBed.configureTestingModule({
      imports: [AuditList],
      providers: [
        provideRouter([]),
        { provide: AuditService, useValue: { search } },
        { provide: HospitalService, useValue: { findActive: () => of([]) } },
        { provide: AuthService, useValue: { hasAnyRole: () => false } },
      ],
    });
  });

  function render(entityId?: string) {
    const fixture = TestBed.createComponent(AuditList);
    if (entityId) {
      fixture.componentRef.setInput('entityType', 'USER');
      fixture.componentRef.setInput('entityId', entityId);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('lista eventos com acção, autor e resultado traduzidos', () => {
    const el = render().nativeElement as HTMLElement;
    const rows = el.querySelectorAll('tbody > tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Ana Admin');
    expect(rows[0].textContent).toContain('Edição');
    expect(rows[1].textContent).toContain('Login falhado');
    expect(rows[1].textContent).toContain('Falhou');
  });

  it('mostra as alterações antes/depois ao abrir os detalhes', () => {
    const fixture = render();
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('td.actions button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const details = el.querySelector('tr.details')!;
    expect(details.textContent).toContain('Nome completo');
    expect(details.textContent).toContain('Rui Costa');
    expect(details.querySelector('.old')?.textContent).toContain('Rui');
    expect(details.textContent).toContain('10.0.0.1');
  });

  it('aplica o filtro de registo vindo do URL', () => {
    render('u2');
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'USER', entityId: 'u2', page: 0, size: 50 }),
    );
  });

  it('envia o período como intervalo ISO com fim exclusivo', () => {
    const fixture = render();
    const c = fixture.componentInstance as unknown as {
      filters: { from: string; to: string };
      applyFilters(): void;
    };
    c.filters.from = '2026-11-01';
    c.filters.to = '2026-11-10';
    c.applyFilters();
    const query = search.mock.calls.at(-1)![0];
    expect(new Date(query.from).getDate()).toBe(1);
    expect(new Date(query.to).getDate()).toBe(11);
  });
});
