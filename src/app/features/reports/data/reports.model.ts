export interface Dashboard {
  from: string;
  to: string;
  patients: { active: number; newInPeriod: number };
  episodes: {
    total: number;
    completed: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
  triage: {
    total: number;
    byPriority: Record<string, number>;
    avgWaitMinutes: number | null;
    withinTargetPercent: number | null;
    avgWaitByPriority: Record<string, number>;
  };
  appointments: {
    total: number;
    checkedIn: number;
    noShow: number;
    cancelled: number;
    noShowPercent: number | null;
  };
  inpatient: {
    activeBeds: number;
    occupiedBeds: number;
    occupancyPercent: number | null;
    admissions: number;
    discharges: number;
    deaths: number;
    avgLengthOfStayDays: number | null;
  };
  lab: {
    requests: number;
    completed: number;
    avgTurnaroundHours: number | null;
    urgentAvgTurnaroundHours: number | null;
    abnormalPercent: number | null;
  };
  pharmacy: { lowStock: number; expiringIn30Days: number; expiredWithBalance: number };
  daily: { date: string; episodes: number; admissions: number; triage: number }[];
}

export interface WardOccupancy {
  wardId: string | null;
  wardName: string;
  beds: number;
  occupiedNow: number;
  admissions: number;
  discharges: number;
  bedDays: number;
  occupancyPercent: number | null;
  avgLengthOfStayDays: number | null;
}

export interface OccupancyReport {
  from: string;
  to: string;
  days: number;
  wards: WardOccupancy[];
  total: WardOccupancy;
}

export const EPISODE_TYPE_LABELS: Record<string, string> = {
  EMERGENCY: 'Urgência',
  OUTPATIENT: 'Consulta',
  INPATIENT: 'Internamento',
  OUTPATIENT_SURGERY: 'Cirurgia de ambulatório',
  EXAM: 'Exame',
};

export const PRIORITY_LABELS: Record<string, string> = {
  RED: 'Vermelho (emergente)',
  ORANGE: 'Laranja (muito urgente)',
  YELLOW: 'Amarelo (urgente)',
  GREEN: 'Verde (pouco urgente)',
  BLUE: 'Azul (não urgente)',
};

/** Cores de Manchester (significado clínico; o nome vai sempre escrito ao lado). */
export const PRIORITY_COLORS: Record<string, string> = {
  RED: 'var(--prio-RED)',
  ORANGE: 'var(--prio-ORANGE)',
  YELLOW: 'var(--prio-YELLOW)',
  GREEN: 'var(--prio-GREEN)',
  BLUE: 'var(--prio-BLUE)',
};
