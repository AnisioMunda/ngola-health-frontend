import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import {
  AppNotification,
  PRIORITY_LABELS,
  priorityBadge,
  safeLink,
} from '../data/notification.model';
import { NotificationService } from '../data/notification.service';

/** Todas as notificações do utilizador, com filtro "por ler" e paginação. */
@Component({
  selector: 'app-notification-list',
  imports: [FormsModule, DatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Notificações</h1>
          <p class="muted">Avisos de resultados de exames, stock e outros eventos.</p>
        </div>
        <div class="header-actions">
          <button
            class="btn btn-secondary"
            type="button"
            [disabled]="notifications.unread() === 0 || busy()"
            (click)="markAllRead()"
          >
            Marcar todas como lidas
          </button>
        </div>
      </header>
      <div class="filters card">
        <label class="check-inline">
          <input
            type="checkbox"
            name="unreadOnly"
            [(ngModel)]="unreadOnly"
            (ngModelChange)="load(0)"
          />
          Só por ler
        </label>
      </div>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="card table-card">
        @if (result(); as page) {
          @if (page.content.length === 0) {
            <p class="empty">
              {{ unreadOnly ? 'Não tem notificações por ler.' : 'Não tem notificações.' }}
            </p>
          } @else {
            <ul class="notification-list">
              @for (n of page.content; track n.id) {
                <li [class.unread]="!n.readAt">
                  <div class="body">
                    <p class="title">
                      @if (!n.readAt) {
                        <span class="visually-hidden">Por ler: </span>
                      }
                      {{ n.title }}
                      @if (badge(n.priority); as cls) {
                        <span class="badge {{ cls }}">{{ priorities[n.priority] }}</span>
                      }
                    </p>
                    <p class="message">{{ n.message }}</p>
                    <small class="muted">{{ n.createdAt | date: 'dd/MM/yyyy HH:mm' }}</small>
                  </div>
                  <div class="actions">
                    @if (link(n)) {
                      <button class="btn btn-small btn-secondary" type="button" (click)="open(n)">
                        Abrir
                      </button>
                    }
                    @if (!n.readAt) {
                      <button
                        class="btn btn-small btn-secondary"
                        type="button"
                        [disabled]="busy()"
                        (click)="markRead(n)"
                      >
                        Marcar como lida
                      </button>
                    }
                  </div>
                </li>
              }
            </ul>
            @if (page.totalPages > 1) {
              <nav class="pagination" aria-label="Paginação">
                <button
                  class="btn btn-small btn-secondary"
                  type="button"
                  [disabled]="page.page === 0"
                  (click)="load(page.page - 1)"
                >
                  Anterior
                </button>
                <span>Página {{ page.page + 1 }} de {{ page.totalPages }}</span>
                <button
                  class="btn btn-small btn-secondary"
                  type="button"
                  [disabled]="page.page + 1 >= page.totalPages"
                  (click)="load(page.page + 1)"
                >
                  Seguinte
                </button>
              </nav>
            }
            <p class="muted total">{{ page.totalElements }} notificação(ões).</p>
          }
        } @else if (!error()) {
          <p class="empty" role="status">A carregar…</p>
        }
      </div>
    </section>
  `,
  styles: `
    .notification-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }
    li.unread {
      background: var(--color-primary-soft);
    }
    li.unread .title {
      font-weight: 700;
    }
    .body {
      flex: 1 1 20rem;
    }
    .title,
    .message {
      margin: 0 0 var(--space-1);
    }
    .actions {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationList implements OnInit {
  protected readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly priorities = PRIORITY_LABELS;
  protected readonly badge = priorityBadge;
  protected readonly result = signal<Page<AppNotification> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected unreadOnly = false;

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.error.set(null);
    this.notifications.list({ unreadOnly: this.unreadOnly, page }).subscribe({
      next: (p) => {
        this.result.set(p);
        this.notifications.refreshCount().subscribe({ error: () => undefined });
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected link(n: AppNotification): string | null {
    return safeLink(n.link);
  }

  protected open(n: AppNotification): void {
    const link = safeLink(n.link);
    if (!link) return;
    if (n.readAt) {
      void this.router.navigateByUrl(link);
      return;
    }
    this.notifications.markRead(n).subscribe({
      next: () => void this.router.navigateByUrl(link),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected markRead(n: AppNotification): void {
    this.busy.set(true);
    this.notifications.markRead(n).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.replace(updated);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }

  protected markAllRead(): void {
    this.busy.set(true);
    this.notifications.markAllRead().subscribe({
      next: () => {
        this.busy.set(false);
        this.load(0);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }

  private replace(updated: AppNotification): void {
    const page = this.result();
    if (!page) return;
    this.result.set({
      ...page,
      content: this.unreadOnly
        ? page.content.filter((n) => n.id !== updated.id)
        : page.content.map((n) => (n.id === updated.id ? updated : n)),
    });
  }
}
