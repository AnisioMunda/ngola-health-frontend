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

import { toApiError } from '../../../core/http/api-error';
import { BarItem, BarList } from '../../../shared/charts/bar-list';
import { OccupancyReport } from '../data/reports.model';
import { Period, ReportsService, saveBlob } from '../data/reports.service';
import { PeriodPicker, lastDays } from '../period-picker';

/** Relatório de ocupação por enfermaria (direcção), com CSV. */
@Component({
  selector: 'app-reports-page',
  imports: [DatePipe, DecimalPipe, PeriodPicker, BarList],
  templateUrl: './reports-page.html',
  styles: `
    .card {
      margin-bottom: var(--space-4);
    }
    .ward {
      color: var(--card-text);
      font-weight: 600;
    }
    .refreshing {
      opacity: 0.6;
      transition: opacity 0.2s;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  private readonly reports = inject(ReportsService);

  protected readonly period = signal<Period>(lastDays(30));
  protected readonly occupancy = signal<OccupancyReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly occupancyBars = computed<BarItem[]>(() =>
    (this.occupancy()?.wards ?? []).map((w) => ({
      label: w.wardName,
      value: w.occupancyPercent ?? 0,
    })),
  );

  constructor() {
    effect(() => {
      const period = this.period();
      untracked(() => this.load(period));
    });
  }

  protected download(): void {
    const p = this.period();
    this.reports.occupancyCsv(p).subscribe({
      next: (blob) => saveBlob(blob, `ocupacao_${p.from}_${p.to}.csv`),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  private load(period: Period): void {
    this.loading.set(true);
    this.error.set(null);
    this.reports.occupancy(period).subscribe({
      next: (r) => {
        this.loading.set(false);
        this.occupancy.set(r);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }
}
