import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { toApiError } from '../../../core/http/api-error';
import { JOB_STATUS_LABELS, SystemStatus, formatBytes, formatUptime } from '../data/system.model';
import { SystemService } from '../data/system.service';

const REFRESH_MS = 30_000;

/** Estado da aplicação para a administração da plataforma; actualiza-se a cada 30 segundos. */
@Component({
  selector: 'app-system-status',
  imports: [DatePipe, DecimalPipe, PercentPipe],
  templateUrl: './system-status.html',
  styleUrl: './system-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemStatusPage implements OnInit {
  private readonly service = inject(SystemService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly data = signal<SystemStatus | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly bytes = formatBytes;
  protected readonly uptime = formatUptime;
  protected readonly jobStatus = JOB_STATUS_LABELS;

  protected readonly heapRatio = computed(() => {
    const jvm = this.data()?.jvm;
    return jvm && jvm.heapMaxBytes > 0 ? jvm.heapUsedBytes / jvm.heapMaxBytes : null;
  });
  protected readonly diskRatio = computed(() => {
    const jvm = this.data()?.jvm;
    return jvm && jvm.diskTotalBytes > 0 ? 1 - jvm.diskFreeBytes / jvm.diskTotalBytes : null;
  });
  protected readonly errorRate = computed(() => {
    const http = this.data()?.http;
    return http && http.requests > 0 ? http.serverErrors / http.requests : null;
  });

  ngOnInit(): void {
    this.load();
    const timer = setInterval(() => this.load(), REFRESH_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  protected load(): void {
    this.loading.set(true);
    this.service.status().subscribe({
      next: (s) => {
        this.loading.set(false);
        this.error.set(null);
        this.data.set(s);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }
}
