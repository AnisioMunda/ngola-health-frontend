/** Formatação de números dos gráficos (pt-AO). */
const integer = new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat('pt-AO', { notation: 'compact', maximumFractionDigits: 1 });

export type ValueFormat = 'integer' | 'decimal' | 'money' | 'percent';

export function formatValue(value: number, format: ValueFormat = 'integer'): string {
  switch (format) {
    case 'money':
      return `${integer.format(Math.round(value))} Kz`;
    case 'percent':
      return `${decimal.format(value)}%`;
    case 'decimal':
      return decimal.format(value);
    default:
      return integer.format(value);
  }
}

/** Marcas de eixo: números redondos, compactos a partir de 10 000 (10 mil, 20 mil…). */
export function formatTick(value: number, format: ValueFormat = 'integer'): string {
  const text = Math.abs(value) >= 10_000 ? compact.format(value) : integer.format(value);
  return format === 'money' ? `${text} Kz` : text;
}

/** Até ~4 divisões "redondas" (1, 2, 2,5 ou 5 × 10ⁿ) que cobrem o máximo. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v < max + step * 0.001; v += step) ticks.push(Math.round(v * 1000) / 1000);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}
