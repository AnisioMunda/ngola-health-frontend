import { DecimalPipe } from '@angular/common';
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
import { formatValue } from '../../../shared/charts/chart-format';
import { ColumnChart } from '../../../shared/charts/column-chart';
import {
  Dashboard as DashboardData,
  EPISODE_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '../data/reports.model';
import { Period, ReportsService } from '../data/reports.service';
import { PeriodPicker, lastDays } from '../period-picker';

/** Dashboard executivo: indicadores do hospital no período, com gráficos onde há tendência. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DecimalPipe, PeriodPicker, BarList, ColumnChart],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly reports = inject(ReportsService);

  protected readonly period = signal<Period>(lastDays(30));
  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly money = (v: number) => formatValue(v, 'money');

  protected readonly episodesDaily = computed(
    () => this.data()?.daily.map((d) => ({ date: d.date, value: d.episodes })) ?? [],
  );
  protected readonly revenueDaily = computed(
    () => this.data()?.daily.map((d) => ({ date: d.date, value: d.revenue })) ?? [],
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
