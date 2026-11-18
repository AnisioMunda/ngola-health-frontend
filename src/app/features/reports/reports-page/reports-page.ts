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

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { BarItem, BarList } from '../../../shared/charts/bar-list';
import { formatValue } from '../../../shared/charts/chart-format';
import { ColumnChart } from '../../../shared/charts/column-chart';
import {
  CATEGORY_LABELS,
  FinancialReport,
  METHOD_LABELS,
  OccupancyReport,
} from '../data/reports.model';
import { Period, ReportsService, saveBlob } from '../data/reports.service';
import { PeriodPicker, lastDays } from '../period-picker';

type Tab = 'occupancy' | 'financial';

/** Relatórios de ocupação (direcção) e financeiro (direcção e financeiro), com CSV. */
@Component({
  selector: 'app-reports-page',
  imports: [DecimalPipe, PeriodPicker, BarList, ColumnChart],
  templateUrl: './reports-page.html',
  styles: `
    .tabs {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }
    .tabs button[aria-selected='true'] {
      background: var(--color-primary-soft);
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
    .card {
      margin-bottom: var(--space-4);
    }
    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
      gap: var(--space-4);
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    tr.total td {
      font-weight: 700;
    }
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }
    .tile {
      display: flex;
      flex-direction: column;
    }
    .tile-label {
      font-size: 0.875rem;
      color: var(--color-muted);
    }
    .tile-value {
      font-size: 1.4rem;
      font-weight: 600;
    }
    .refreshing {
      opacity: 0.6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  private readonly reports = inject(ReportsService);
  private readonly auth = inject(AuthService);

  protected readonly canOccupancy = computed(() => this.auth.hasAnyRole(ACCESS.reportsRead));
  protected readonly canFinancial = computed(() => this.auth.hasAnyRole(ACCESS.financialReports));
  protected readonly tab = signal<Tab>(
    this.auth.hasAnyRole(ACCESS.reportsRead) ? 'occupancy' : 'financial',
  );
  protected readonly period = signal<Period>(lastDays(30));
  protected readonly occupancy = signal<OccupancyReport | null>(null);
  protected readonly financial = signal<FinancialReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly money = (v: number) => formatValue(v, 'money');

  protected readonly occupancyBars = computed<BarItem[]>(() =>
    (this.occupancy()?.wards ?? []).map((w) => ({
      label: w.wardName,
      value: w.occupancyPercent ?? 0,
    })),
  );
  protected readonly receivedDaily = computed(
    () => this.financial()?.daily.map((d) => ({ date: d.date, value: d.received })) ?? [],
  );
  protected readonly byMethod = computed<BarItem[]>(() =>
    (this.financial()?.byPaymentMethod ?? []).map((a) => ({
      label: METHOD_LABELS[a.key] ?? a.key,
      value: a.amount,
    })),
  );
  protected readonly byCategory = computed<BarItem[]>(() =>
    (this.financial()?.byCategory ?? []).map((a) => ({
      label: CATEGORY_LABELS[a.key] ?? a.key,
      value: a.amount,
    })),
  );

  constructor() {
    effect(() => {
      const tab = this.tab();
      const period = this.period();
      untracked(() => this.load(tab, period));
    });
  }

  protected download(): void {
    const tab = this.tab();
    const p = this.period();
    this.reports.csv(tab, p).subscribe({
      next: (blob) =>
        saveBlob(blob, `${tab === 'occupancy' ? 'ocupacao' : 'financeiro'}_${p.from}_${p.to}.csv`),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  private load(tab: Tab, period: Period): void {
    this.loading.set(true);
    this.error.set(null);
    const fail = (err: unknown) => {
      this.loading.set(false);
      this.error.set(toApiError(err).message);
    };
    if (tab === 'occupancy') {
      this.reports.occupancy(period).subscribe({
        next: (r) => {
          this.loading.set(false);
          this.occupancy.set(r);
        },
        error: fail,
      });
    } else {
      this.reports.financial(period).subscribe({
        next: (r) => {
          this.loading.set(false);
          this.financial.set(r);
        },
        error: fail,
      });
    }
  }
}
