export type EpisodeType = 'EMERGENCY' | 'OUTPATIENT' | 'INPATIENT' | 'OUTPATIENT_SURGERY' | 'EXAM';
export type EpisodeStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const TYPE_LABELS: Record<EpisodeType, string> = {
  EMERGENCY: 'Urgência',
  OUTPATIENT: 'Consulta externa',
  INPATIENT: 'Internamento',
  OUTPATIENT_SURGERY: 'Cirurgia de ambulatório',
  EXAM: 'Exame',
};

export const STATUS_LABELS: Record<EpisodeStatus, string> = {
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export interface EpisodeSummary {
  id: string;
  patientId: string;
  patientName: string | null;
  patientRecordNumber: string | null;
  type: EpisodeType;
  status: EpisodeStatus;
  scheduledAt: string;
  reason: string;
  doctorId: string | null;
  doctorName: string | null;
}

export interface Vitals {
  systolicBp: number | null;
  diastolicBp: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  weightKg: number | null;
  heightCm: number | null;
}

export interface Episode extends EpisodeSummary {
  symptoms: string | null;
  diagnosis: string | null;
  clinicalNotes: string | null;
  vitals: (Vitals & { recordedAt: string; recordedByName: string | null }) | null;
  startedAt: string | null;
  startedByName: string | null;
  completedAt: string | null;
  completedByName: string | null;
  cancelledAt: string | null;
  cancelledByName: string | null;
  cancellationReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeSearch {
  status?: EpisodeStatus[];
  patientId?: string;
  doctorId?: string;
  type?: EpisodeType;
  from?: string;
  to?: string;
  order?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialty: string | null;
}
