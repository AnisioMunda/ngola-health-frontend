import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { BarItem, BarList } from '../../../shared/charts/bar-list';
import { ColumnChart } from '../../../shared/charts/column-chart';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import {
  Dashboard as DashboardData,
  EPISODE_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '../data/reports.model';
import { Period, ReportsService } from '../data/reports.service';
import { PeriodPicker, lastDays, periodDays } from '../period-picker';

const ONE_DECIMAL = new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 1 });

/** Dashboard executivo: indicadores do hospital no período, com gráficos onde há tendência. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, DecimalPipe, PeriodPicker, BarList, ColumnChart, StatCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly reports = inject(ReportsService);

  protected readonly period = signal<Period>(lastDays(30));
  protected readonly periodLength = computed(() => periodDays(this.period()));
  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly episodesDaily = computed(
    () => this.data()?.daily.map((d) => ({ date: d.date, value: d.episodes })) ?? [],
  );
  protected readonly triageByPriority = computed<BarItem[]>(() =>
    Object.entries(this.data()?.triage.byPriority ?? {}).map(([k, v]) => ({
      label: PRIORITY_LABELS[k] ?? k,
      value: v,
      color: PRIORITY_COLORS[k],
    })),
  );
  protected readonly waitByPriority = computed<BarItem[]>(() =>
    Object.entries(this.data()?.triage.avgWaitByPriority ?? {}).map(([k, v]) => ({
      label: PRIORITY_LABELS[k] ?? k,
      value: v,
      color: PRIORITY_COLORS[k],
    })),
  );
  protected readonly episodesByType = computed<BarItem[]>(() =>
    Object.entries(this.data()?.episodes.byType ?? {}).map(([k, v]) => ({
      label: EPISODE_TYPE_LABELS[k] ?? k,
      value: v,
    })),
  );

  /** 23,3% (pt-AO), ou "—" sem dados. */
  protected percent(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${ONE_DECIMAL.format(value)}%`;
  }

  /** 42,1 (pt-AO), ou "—" sem dados. */
  protected decimal(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : ONE_DECIMAL.format(value);
  }

  protected hours(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${ONE_DECIMAL.format(value)} h`;
  }

  constructor() {
    // Recarrega quando o período muda; mantém os dados anteriores visíveis até chegarem os novos.
    effect(() => {
      const period = this.period();
      untracked(() => this.load(period));
    });
  }

  private load(period: Period): void {
    this.loading.set(true);
    this.error.set(null);
    this.reports.dashboard(period).subscribe({
      next: (d) => {
        this.loading.set(false);
        this.data.set(d);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }
}
