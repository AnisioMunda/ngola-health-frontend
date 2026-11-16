import { Gender } from '../../patients/data/patient.model';

export type WardType =
  'GENERAL' | 'MEDICINE' | 'SURGERY' | 'PEDIATRICS' | 'MATERNITY' | 'ICU' | 'ISOLATION' | 'OTHER';
export type GenderPolicy = 'MIXED' | 'MALE' | 'FEMALE';
export type BedType = 'STANDARD' | 'ICU' | 'ISOLATION' | 'CRIB';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
export type AdmissionStatus = 'ACTIVE' | 'DISCHARGED' | 'CANCELLED';
export type DischargeCondition = 'IMPROVED' | 'STABLE' | 'WORSENED' | 'DECEASED';

export interface Ward {
  id: string;
  code: string;
  name: string;
  type: WardType;
  genderPolicy: GenderPolicy;
  floor: string | null;
  notes: string | null;
  active: boolean;
  beds: number;
  available: number;
  occupied: number;
  cleaning: number;
  maintenance: number;
  version: number;
}

export interface WardRequest {
  code: string;
  name: string;
  type: WardType;
  genderPolicy: GenderPolicy;
  floor: string | null;
  notes: string | null;
  version: number | null;
}

export interface Occupant {
  admissionId: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  patientRecordNumber: string;
  gender: Gender | null;
  age: number | null;
  responsibleDoctorName: string;
  admittedAt: string;
  expectedDischargeDate: string | null;
}

export interface Bed {
  id: string;
  wardId: string;
  code: string;
  type: BedType;
  status: BedStatus;
  statusNote: string | null;
  active: boolean;
  occupant: Occupant | null;
}

export interface WardMap {
  ward: Ward;
  beds: Bed[];
}

export interface TransferView {
  fromWardName: string;
  fromBedCode: string;
  toWardName: string;
  toBedCode: string;
  reason: string;
  transferredByName: string;
  transferredAt: string;
}

export interface Admission {
  id: string;
  number: string;
  patientId: string;
  patientName: string;
  patientRecordNumber: string;
  gender: Gender | null;
  age: number | null;
  episodeId: string;
  originEpisodeId: string | null;
  wardId: string;
  wardName: string;
  bedId: string;
  bedCode: string;
  responsibleDoctorId: string;
  responsibleDoctorName: string;
  status: AdmissionStatus;
  reason: string;
  admittedByName: string;
  admittedAt: string;
  expectedDischargeDate: string | null;
  lengthOfStayDays: number;
  dischargedByName: string | null;
  dischargedAt: string | null;
  dischargeCondition: DischargeCondition | null;
  dischargeDiagnosis: string | null;
  dischargeSummary: string | null;
  cancelledByName: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  transfers: TransferView[];
  version: number;
}

export interface AdmitRequest {
  patientId: string;
  bedId: string;
  responsibleDoctorId: string | null;
  originEpisodeId: string | null;
  reason: string;
  expectedDischargeDate: string | null;
}

export const WARD_TYPE_LABELS: Record<WardType, string> = {
  GENERAL: 'Geral',
  MEDICINE: 'Medicina',
  SURGERY: 'Cirurgia',
  PEDIATRICS: 'Pediatria',
  MATERNITY: 'Maternidade',
  ICU: 'Cuidados intensivos',
  ISOLATION: 'Isolamento',
  OTHER: 'Outra',
};

export const GENDER_POLICY_LABELS: Record<GenderPolicy, string> = {
  MIXED: 'Mista',
  MALE: 'Masculina',
  FEMALE: 'Feminina',
};

export const BED_TYPE_LABELS: Record<BedType, string> = {
  STANDARD: 'Normal',
  ICU: 'Cuidados intensivos',
  ISOLATION: 'Isolamento',
  CRIB: 'Berço',
};

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  AVAILABLE: 'Livre',
  OCCUPIED: 'Ocupada',
  CLEANING: 'Em limpeza',
  MAINTENANCE: 'Manutenção',
};

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  ACTIVE: 'Internado',
  DISCHARGED: 'Alta',
  CANCELLED: 'Anulado',
};

export const CONDITION_LABELS: Record<DischargeCondition, string> = {
  IMPROVED: 'Melhorado',
  STABLE: 'Estável',
  WORSENED: 'Agravado',
  DECEASED: 'Óbito',
};

/** Percentagem de ocupação (camas activas). */
export function occupancy(w: Ward): number {
  return w.beds === 0 ? 0 : Math.round((w.occupied / w.beds) * 100);
}

/** Anulação possível nas primeiras 24 horas (o backend confirma). */
export function canStillCancel(a: Admission, now = new Date()): boolean {
  return now.getTime() - new Date(a.admittedAt).getTime() < 24 * 3600 * 1000;
}
