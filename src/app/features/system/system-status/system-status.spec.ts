import { registerLocaleData } from '@angular/common';
import localePtAo from '@angular/common/locales/pt-AO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SystemStatus, formatBytes, formatUptime } from '../data/system.model';
import { SystemService } from '../data/system.service';
import { SystemStatusPage } from './system-status';

registerLocaleData(localePtAo);

const status: SystemStatus = {
  generatedAt: '2026-11-18T12:00:00Z',
  application: {
    version: '0.0.1-SNAPSHOT',
    builtAt: '2026-11-18T10:00:00Z',
    startedAt: '2026-11-17T09:00:00Z',
    uptimeSeconds: 97_200,
    javaVersion: '25',
  },
  database: {
    up: true,
    latencyMs: 2,
    poolActive: 1,
    poolIdle: 4,
    poolMax: 10,
    poolPending: 0,
    migrations: 40,
    lastMigration: 'financial-002-drop-financial',
    lastMigrationAt: '2026-11-18T09:00:00Z',
  },
  jvm: {
    heapUsedBytes: 256 * 1024 * 1024,
    heapMaxBytes: 1024 * 1024 * 1024,
    processCpu: 0.05,
    threads: 40,
    diskFreeBytes: 50 * 1024 ** 3,
    diskTotalBytes: 200 * 1024 ** 3,
  },
  http: { requests: 1000, clientErrors: 20, serverErrors: 3, meanMs: 12.4, maxMs: 300 },
  logins: { success: 25, failed: 6, locked: 1 },
  activeSessions: 7,
  jobs: [
    {
      name: 'NotificationCleanupJob',
      label: 'Limpeza de notificações antigas',
      cron: '0 15 3 * * *',
      nextRun: '2026-11-19T02:15:00Z',
      lastStatus: null,
      lastRunAt: null,
      lastError: null,
    },
    {
      name: 'StockAlertJob',
      label: 'Resumo diário de stock da farmácia',
      cron: '0 30 7 * * *',
      nextRun: '2026-11-19T06:30:00Z',
      lastStatus: 'ERROR',
      lastRunAt: '2026-11-18T06:30:00Z',
      lastError: 'IllegalStateException',
    },
  ],
};

describe('SystemStatusPage', () => {
  afterEach(() => vi.useRealTimers());

  function render() {
    const service = { status: vi.fn().mockReturnValue(of(status)) };
    TestBed.configureTestingModule({
      imports: [SystemStatusPage],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-AO' },
        { provide: SystemService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(SystemStatusPage);
    fixture.detectChanges();
    return { fixture, service, el: fixture.nativeElement as HTMLElement };
  }

  it('mostra base de dados, tempo ligado, erros, logins e tarefas', () => {
    const { el } = render();
    const text = el.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(text).toContain('Disponível');
    expect(text).toContain('1 d 3 h');
    expect(text).toMatch(/Sessões activas\s*7/);
    expect(text).toMatch(/Erros do servidor \(5xx\)\s*3/);
    expect(text).toContain('1 em contas bloqueadas');
    expect(text).toContain('256,0 MB');
    expect(text).toContain('Ainda não correu desde o arranque');
    expect(text).toContain('Falhou');
    expect(text).toContain('IllegalStateException');
    expect(el.querySelectorAll('.alert-tile').length).toBe(2);
  });

  it('actualiza sozinho a cada 30 segundos e pára ao sair', () => {
    vi.useFakeTimers();
    const { fixture, service } = render();
    expect(service.status).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30_000);
    expect(service.status).toHaveBeenCalledTimes(2);
    fixture.destroy();
    vi.advanceTimersByTime(60_000);
    expect(service.status).toHaveBeenCalledTimes(2);
  });

  it('formata bytes e tempo ligado', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(formatUptime(30)).toBe('< 1 min');
    expect(formatUptime(3_660)).toBe('1 h 1 min');
  });
});
