import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AppNotification } from '../data/notification.model';
import { NotificationService } from '../data/notification.service';
import { NotificationBell } from './notification-bell';

function notification(extra: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'n1',
    type: 'LAB_RESULTS_READY',
    priority: 'HIGH',
    title: 'Resultados disponíveis — LAB-2026-000001',
    message: 'Ana Silva (processo 000001): 2 exames validados.',
    link: '/lab/requests/r1',
    referenceType: 'LAB_REQUEST',
    referenceId: 'r1',
    createdAt: '2026-11-12T10:00:00Z',
    readAt: null,
    ...extra,
  };
}

function render(items: AppNotification[], unread = items.length) {
  const count = signal(unread);
  const service = {
    unread: count.asReadonly(),
    refreshCount: vi.fn().mockReturnValue(of({ count: unread })),
    list: vi
      .fn()
      .mockReturnValue(
        of({ content: items, page: 0, size: 5, totalElements: items.length, totalPages: 1 }),
      ),
    markRead: vi.fn().mockImplementation((n: AppNotification) => {
      count.update((c) => c - 1);
      return of({ ...n, readAt: '2026-11-12T11:00:00Z' });
    }),
    markAllRead: vi.fn().mockImplementation(() => {
      count.set(0);
      return of({ count: 0 });
    }),
  };
  TestBed.configureTestingModule({
    imports: [NotificationBell],
    providers: [provideRouter([]), { provide: NotificationService, useValue: service }],
  });
  const fixture = TestBed.createComponent(NotificationBell);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  const open = () => {
    el.querySelector<HTMLButtonElement>('button.bell')!.click();
    fixture.detectChanges();
  };
  return { fixture, el, service, navigate, open };
}

describe('NotificationBell', () => {
  it('mostra o número por ler e um rótulo acessível', () => {
    const { el } = render([notification()], 3);
    expect(el.querySelector('.count')?.textContent?.trim()).toBe('3');
    expect(el.querySelector('button.bell')?.getAttribute('aria-label')).toBe(
      'Notificações, 3 por ler',
    );
  });

  it('sem notificações por ler não mostra contador', () => {
    const { el } = render([], 0);
    expect(el.querySelector('.count')).toBeNull();
  });

  it('abre as últimas por ler e, ao escolher, marca como lida e navega', () => {
    const { el, open, service, navigate } = render([notification()]);
    open();
    expect(service.list).toHaveBeenCalledWith({ unreadOnly: true, size: 5 });
    el.querySelector<HTMLButtonElement>('.item')!.click();
    expect(service.markRead).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/lab/requests/r1');
  });

  it('nunca segue links externos', () => {
    const { el, open, navigate } = render([notification({ link: '//malicioso.example' })]);
    open();
    el.querySelector<HTMLButtonElement>('.item')!.click();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('marcar todas como lidas esvazia a lista e o contador', () => {
    const { el, open, fixture, service } = render([notification()]);
    open();
    [...el.querySelectorAll<HTMLButtonElement>('.link-button')]
      .find((b) => b.textContent?.includes('Marcar todas'))!
      .click();
    fixture.detectChanges();
    expect(service.markAllRead).toHaveBeenCalled();
    expect(el.querySelector('.count')).toBeNull();
    expect(el.textContent).toContain('Não tem notificações por ler.');
  });

  it('Escape fecha o painel', () => {
    const { el, open, fixture } = render([notification()]);
    open();
    expect(el.querySelector('.panel')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('.panel')).toBeNull();
  });
});
