import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import { dayStartIso } from '../../audit/data/audit-format';
import { EpisodeStatus, EpisodeSummary, STATUS_LABELS, TYPE_LABELS } from '../data/episode.model';
import { EpisodeService } from '../data/episode.service';

export type StatusView = 'open' | 'COMPLETED' | 'CANCELLED' | 'all';

const VIEW_STATUSES: Record<StatusView, EpisodeStatus[] | undefined> = {
  open: ['SCHEDULED', 'IN_PROGRESS'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
  all: undefined,
};

/** Lista de trabalho: episódios abertos por ordem de hora; histórico do mais recente. */
@Component({
  selector: 'app-episode-list',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './episode-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeList implements OnInit {
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);
  private request?: Subscription;

  protected readonly typeLabels = TYPE_LABELS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly isDoctor = computed(() => this.auth.hasAnyRole(['DOCTOR']));
  protected readonly canSchedule = computed(() => this.auth.hasAnyRole(ACCESS.episodesSchedule));
  protected readonly result = signal<Page<EpisodeSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected view: StatusView = 'open';
  protected onlyMine = false;
  protected day = '';
  private page = 0;

  ngOnInit(): void {
    this.onlyMine = this.isDoctor();
    this.load();
  }

  protected applyFilters(): void {
    this.page = 0;
    this.load();
  }

  protected goToPage(page: number): void {
    this.page = page;
    this.load();
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.episodes
      .search({
        status: VIEW_STATUSES[this.view],
        doctorId: this.onlyMine ? this.auth.user()?.id : undefined,
        from: this.day ? dayStartIso(this.day) : undefined,
        to: this.day ? dayStartIso(this.day, true) : undefined,
        order: this.view === 'open' ? 'asc' : 'desc',
        page: this.page,
        size: 20,
      })
      .subscribe({
        next: (page) => {
          this.result.set(page);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(toApiError(err).message);
          this.loading.set(false);
        },
      });
  }
}
