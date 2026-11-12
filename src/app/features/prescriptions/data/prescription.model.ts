export type Route =
  | 'ORAL'
  | 'SUBLINGUAL'
  | 'INTRAVENOUS'
  | 'INTRAMUSCULAR'
  | 'SUBCUTANEOUS'
  | 'TOPICAL'
  | 'INHALED'
  | 'RECTAL'
  | 'OPHTHALMIC'
  | 'OTIC'
  | 'NASAL'
  | 'OTHER';

export type PrescriptionStatus = 'ACTIVE' | 'PARTIALLY_DISPENSED' | 'DISPENSED' | 'CANCELLED';
export type EffectiveStatus = PrescriptionStatus | 'EXPIRED';

export const ROUTE_LABELS: Record<Route, string> = {
  ORAL: 'Oral',
  SUBLINGUAL: 'Sublingual',
  INTRAVENOUS: 'Endovenosa',
  INTRAMUSCULAR: 'Intramuscular',
  SUBCUTANEOUS: 'Subcutânea',
  TOPICAL: 'Tópica',
  INHALED: 'Inalatória',
  RECTAL: 'Rectal',
  OPHTHALMIC: 'Oftálmica',
  OTIC: 'Auricular',
  NASAL: 'Nasal',
  OTHER: 'Outra',
};

export const PRESCRIPTION_STATUS_LABELS: Record<EffectiveStatus, string> = {
  ACTIVE: 'Activa',
  PARTIALLY_DISPENSED: 'Parcialmente dispensada',
  DISPENSED: 'Dispensada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Caducada',
};

export interface PrescriptionItem {
  id: string;
  lineNumber: number;
  medicationId: string;
  medicationName: string | null;
  dispensingUnit: string | null;
  quantity: number;
  quantityDispensed: number;
  remaining: number;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  route: Route;
  instructions: string | null;
  stockAvailable: number;
}

export interface Prescription {
  id: string;
  number: string;
  patientId: string;
  patientName: string | null;
  patientRecordNumber: string | null;
  episodeId: string;
  prescriberId: string;
  prescriberName: string | null;
  status: PrescriptionStatus;
  effectiveStatus: EffectiveStatus;
  issuedAt: string;
  validUntil: string;
  notes: string | null;
  cancelledAt: string | null;
  cancelledByName: string | null;
  cancellationReason: string | null;
  items: PrescriptionItem[];
  version: number;
}

export interface NewItem {
  medicationId: string;
  quantity: number;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  route: Route;
  instructions: string | null;
}
