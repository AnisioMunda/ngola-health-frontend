import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, filter, switchMap, timer } from 'rxjs';

import { toApiError } from '../../../core/http/api-error';
import { AppNotification, priorityBadge, safeLink } from '../data/notification.model';
import { NotificationService } from '../data/notification.service';

/** Intervalo de actualização do contador (só com o separador visível). */
export const POLL_INTERVAL_MS = 60_000;

/** Sino do cabeçalho: contador de por ler e as últimas notificações por ler. */
@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink, DatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
    '(document:visibilitychange)': 'onVisibilityChange()',
  },
})
export class NotificationBell implements OnInit {
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly unread = this.notifications.unread;
  protected readonly open = signal(false);
  protected readonly items = signal<AppNotification[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly badge = priorityBadge;

  ngOnInit(): void {
    timer(0, POLL_INTERVAL_MS)
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        switchMap(() => this.notifications.refreshCount().pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.loadLatest();
  }

  close(): void {
    this.open.set(false);
  }

  protected select(n: AppNotification): void {
    const link = safeLink(n.link);
    const go = () => {
      this.close();
      if (link) void this.router.navigateByUrl(link);
    };
    if (n.readAt) {
      go();
      return;
    }
    this.notifications.markRead(n).subscribe({
      next: go,
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected markAllRead(): void {
    this.notifications.markAllRead().subscribe({
      next: () => this.items.set([]),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  protected onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.notifications.refreshCount().subscribe({ error: () => undefined });
    }
  }

  private loadLatest(): void {
    this.error.set(null);
    this.items.set(null);
    this.notifications.list({ unreadOnly: true, size: 5 }).subscribe({
      next: (page) => {
        this.items.set(page.content);
        this.notifications.refreshCount().subscribe({ error: () => undefined });
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
