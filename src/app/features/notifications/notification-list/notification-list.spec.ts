import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AppNotification } from '../data/notification.model';
import { NotificationService } from '../data/notification.service';
import { NotificationList } from './notification-list';

const unread: AppNotification = {
  id: 'n1',
  type: 'STOCK_ALERTS',
  priority: 'CRITICAL',
  title: 'Stock: acção urgente',
  message: '1 medicamento no stock mínimo ou abaixo (1 esgotado): Paracetamol.',
  link: '/pharmacy/alerts',
  referenceType: 'STOCK',
  referenceId: null,
  createdAt: '2026-11-12T07:30:00Z',
  readAt: null,
};
const read: AppNotification = {
  ...unread,
  id: 'n2',
  priority: 'NORMAL',
  readAt: '2026-11-12T08:00:00Z',
};

function render() {
  const service = {
    unread: signal(1).asReadonly(),
    refreshCount: vi.fn().mockReturnValue(of({ count: 1 })),
    list: vi
      .fn()
      .mockReturnValue(
        of({ content: [unread, read], page: 0, size: 20, totalElements: 2, totalPages: 1 }),
      ),
    markRead: vi.fn().mockReturnValue(of({ ...unread, readAt: '2026-11-12T09:00:00Z' })),
    markAllRead: vi.fn().mockReturnValue(of({ count: 0 })),
  };
  TestBed.configureTestingModule({
    imports: [NotificationList],
    providers: [provideRouter([]), { provide: NotificationService, useValue: service }],
  });
  const fixture = TestBed.createComponent(NotificationList);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, service };
}

describe('NotificationList', () => {
  it('destaca as por ler e a prioridade crítica', () => {
    const { el } = render();
    const rows = el.querySelectorAll('li');
    expect(rows.length).toBe(2);
    expect(rows[0].classList).toContain('unread');
    expect(rows[0].querySelector('.badge-danger')?.textContent).toContain('Crítica');
    expect(rows[1].classList).not.toContain('unread');
    expect(rows[1].textContent).not.toContain('Marcar como lida');
  });

  it('marcar como lida actualiza a linha sem recarregar', () => {
    const { el, fixture, service } = render();
    [...el.querySelectorAll<HTMLButtonElement>('li button')]
      .find((b) => b.textContent?.includes('Marcar como lida'))!
      .click();
    fixture.detectChanges();
    expect(service.markRead).toHaveBeenCalledWith(unread);
    expect(el.querySelectorAll('li.unread').length).toBe(0);
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('o filtro "Só por ler" pede só as por ler', () => {
    const { el, fixture, service } = render();
    const box = el.querySelector<HTMLInputElement>('input[name=unreadOnly]')!;
    box.click();
    fixture.detectChanges();
    expect(service.list).toHaveBeenLastCalledWith({ unreadOnly: true, page: 0 });
  });
});
