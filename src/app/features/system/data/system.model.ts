/** Estado da aplicação (GET /system/status). Contadores "desde o arranque" do backend. */
export interface SystemStatus {
  generatedAt: string;
  application: {
    version: string | null;
    builtAt: string | null;
    startedAt: string;
    uptimeSeconds: number;
    javaVersion: string;
  };
  database: {
    up: boolean;
    latencyMs: number | null;
    poolActive: number | null;
    poolIdle: number | null;
    poolMax: number | null;
    poolPending: number | null;
    migrations: number;
    lastMigration: string | null;
    lastMigrationAt: string | null;
  };
  jvm: {
    heapUsedBytes: number;
    heapMaxBytes: number;
    processCpu: number | null;
    threads: number;
    diskFreeBytes: number;
    diskTotalBytes: number;
  };
  http: {
    requests: number;
    clientErrors: number;
    serverErrors: number;
    meanMs: number | null;
    maxMs: number | null;
  };
  logins: { success: number; failed: number; locked: number };
  activeSessions: number;
  jobs: SystemJob[];
}

export interface SystemJob {
  name: string;
  label: string;
  cron: string | null;
  nextRun: string | null;
  lastStatus: 'STARTED' | 'SUCCESS' | 'ERROR' | null;
  lastRunAt: string | null;
  lastError: string | null;
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  STARTED: 'A correr',
  SUCCESS: 'Concluída',
  ERROR: 'Falhou',
};

/** 1536 → "1,5 KB" (base 1024, uma casa decimal). */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 ? 0 : 1;
  return `${value.toLocaleString('pt-AO', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${units[unit]}`;
}

/** 93784 → "1 d 2 h 3 min"; menos de um minuto → "< 1 min". */
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [d ? `${d} d` : '', h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean);
  return parts.length ? parts.join(' ') : '< 1 min';
}
