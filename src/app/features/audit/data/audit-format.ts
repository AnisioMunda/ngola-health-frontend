import { FIELD_LABELS } from './audit.model';

export interface ChangeRow {
  field: string;
  label: string;
  from?: string;
  to: string;
}

/** Converte o JSON de alterações em linhas: edição (de → para) ou criação (valor). */
export function changeRows(changes: Record<string, unknown> | null): ChangeRow[] {
  if (!changes) return [];
  return Object.entries(changes).map(([field, value]) => {
    const label = FIELD_LABELS[field] ?? field;
    if (isDiff(value)) {
      return { field, label, from: formatValue(value.from), to: formatValue(value.to) };
    }
    return { field, label, to: formatValue(value) };
  });
}

export function isEdit(changes: Record<string, unknown> | null): boolean {
  return !!changes && Object.values(changes).some(isDiff);
}

function isDiff(value: unknown): value is { from: unknown; to: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'from' in value &&
    'to' in value &&
    Object.keys(value).length === 2
  );
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.map(formatValue).join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Data local (aaaa-mm-dd) → início desse dia em ISO; com {@code nextDay}, início do dia seguinte. */
export function dayStartIso(date: string, nextDay = false): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d + (nextDay ? 1 : 0)).toISOString();
}
