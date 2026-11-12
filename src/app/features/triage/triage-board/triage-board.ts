import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, interval } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TRIAGE_STATUS_LABELS,
  Triage,
  TriageStats,
} from '../data/triage.model';
import { TriageService } from '../data/triage.service';

/** Intervalo de actualização automática do quadro (ms). */
export const REFRESH_MS = 30_000;

/** Quadro da urgência: indicadores e fila por prioridade, actualizado automaticamente. */
@Component({
  selector: 'app-triage-board',
  imports: [RouterLink, DatePipe],
  templateUrl: './triage-board.html',
  styleUrl: './triage-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriageBoard implements OnInit {
  private readonly triage = inject(TriageService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly statusLabels = TRIAGE_STATUS_LABELS;
  protected readonly canTriage = computed(() => this.auth.hasAnyRole(ACCESS.triageStaff));
  protected readonly canMarkLeft = computed(() => this.auth.hasAnyRole(ACCESS.triageDesk));
  protected readonly queue = signal<Triage[]>([]);
  protected readonly stats = signal<TriageStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly updatedAt = signal<Date | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly notice = signal<string | null>(readNotice());

  protected readonly waiting = computed(() => this.queue().filter((t) => t.status === 'WAITING'));
  protected readonly inProgress = computed(() =>
    this.queue().filter((t) => t.status === 'IN_PROGRESS'),
  );

  ngOnInit(): void {
    this.load();
    interval(REFRESH_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  protected load(): void {
    forkJoin({ queue: this.triage.queue(), stats: this.triage.stats() }).subscribe({
      next: ({ queue, stats }) => {
        this.queue.set(queue);
        this.stats.set(stats);
        this.updatedAt.set(new Date());
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected call(t: Triage): void {
    this.act(t, () => this.triage.call(t.id));
  }

  protected markLeft(t: Triage): void {
    if (!confirm(`Senha ${t.queueNumber} (${t.displayName}) saiu sem ser atendida?`)) return;
    this.act(t, () => this.triage.left(t.id));
  }

  private act(t: Triage, action: () => ReturnType<TriageService['call']>): void {
    this.busyId.set(t.id);
    action().subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.error.set(toApiError(err).message);
      },
    });
  }
}

function readNotice(): string | null {
  const state: unknown = typeof history === 'undefined' ? null : history.state;
  return state && typeof state === 'object' && 'notice' in state && typeof state.notice === 'string'
    ? state.notice
    : null;
}
