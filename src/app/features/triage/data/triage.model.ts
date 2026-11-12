import { Gender } from '../../patients/data/patient.model';
import { Vitals } from '../../episodes/data/episode.model';

export type TriagePriority = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE';
export type TriageStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'LEFT';

export const PRIORITIES: TriagePriority[] = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'];

/** Designações do protocolo de Manchester. */
export const PRIORITY_LABELS: Record<TriagePriority, string> = {
  RED: 'Vermelho · Imediato',
  ORANGE: 'Laranja · Muito urgente',
  YELLOW: 'Amarelo · Urgente',
  GREEN: 'Verde · Pouco urgente',
  BLUE: 'Azul · Não urgente',
};

export const TRIAGE_STATUS_LABELS: Record<TriageStatus, string> = {
  WAITING: 'Em espera',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluída',
  LEFT: 'Saiu sem ser atendido',
};

export interface PriorityChange {
  from: TriagePriority;
  to: TriagePriority;
  reason: string;
  changedByName: string | null;
  changedAt: string;
}

export interface Triage {
  id: string;
  queueDate: string;
  queueNumber: number;
  patientId: string | null;
  patientRecordNumber: string | null;
  displayName: string;
  identified: boolean;
  tempAge: number | null;
  tempGender: Gender | null;
  priority: TriagePriority;
  chiefComplaint: string;
  painScale: number | null;
  notes: string | null;
  vitals: Vitals | null;
  status: TriageStatus;
  triagedAt: string;
  triagedByName: string | null;
  calledAt: string | null;
  calledByName: string | null;
  closedAt: string | null;
  closedByName: string | null;
  episodeId: string | null;
  waitingMinutes: number;
  targetMinutes: number;
  overdue: boolean;
  priorityChanges: PriorityChange[];
  version: number;
}

export interface TriageStats {
  day: string;
  triagedToday: number;
  waiting: number;
  inProgress: number;
  overdue: number;
  leftToday: number;
  waitingByPriority: Record<TriagePriority, number>;
  averageWaitMinutesToday: number | null;
}

export interface CreateTriage {
  patientId: string | null;
  tempName: string | null;
  tempAge: number | null;
  tempGender: Gender | null;
  priority: TriagePriority;
  chiefComplaint: string;
  painScale: number | null;
  notes: string | null;
  vitals: Partial<Vitals> | null;
}
