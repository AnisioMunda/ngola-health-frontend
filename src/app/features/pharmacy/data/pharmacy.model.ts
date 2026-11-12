export type DosageForm =
  | 'TABLET'
  | 'CAPSULE'
  | 'SYRUP'
  | 'SUSPENSION'
  | 'SOLUTION'
  | 'INJECTION'
  | 'CREAM'
  | 'OINTMENT'
  | 'DROPS'
  | 'INHALER'
  | 'SUPPOSITORY'
  | 'POWDER'
  | 'PATCH'
  | 'OTHER';

export type MovementType =
  | 'RECEIPT'
  | 'DISPENSE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'WRITE_OFF_EXPIRED'
  | 'WRITE_OFF_DAMAGED';

export type AdjustmentKind = 'COUNT_SURPLUS' | 'COUNT_SHORTAGE' | 'DAMAGED';

export const FORM_LABELS: Record<DosageForm, string> = {
  TABLET: 'Comprimido',
  CAPSULE: 'Cápsula',
  SYRUP: 'Xarope',
  SUSPENSION: 'Suspensão',
  SOLUTION: 'Solução',
  INJECTION: 'Injectável',
  CREAM: 'Creme',
  OINTMENT: 'Pomada',
  DROPS: 'Gotas',
  INHALER: 'Inalador',
  SUPPOSITORY: 'Supositório',
  POWDER: 'Pó',
  PATCH: 'Adesivo',
  OTHER: 'Outra',
};

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  RECEIPT: 'Entrada',
  DISPENSE: 'Dispensa',
  ADJUSTMENT_IN: 'Acerto (+)',
  ADJUSTMENT_OUT: 'Acerto (−)',
  WRITE_OFF_EXPIRED: 'Abate · expirado',
  WRITE_OFF_DAMAGED: 'Abate · dano',
};

export const ADJUSTMENT_LABELS: Record<AdjustmentKind, string> = {
  COUNT_SURPLUS: 'Contagem acima do registado (+)',
  COUNT_SHORTAGE: 'Contagem abaixo do registado (−)',
  DAMAGED: 'Produto danificado (abate)',
};

export interface Medication {
  id: string;
  name: string;
  genericName: string | null;
  dosageForm: DosageForm;
  strength: string | null;
  dispensingUnit: string;
  requiresPrescription: boolean;
  minStockLevel: number;
  active: boolean;
  stockAvailable: number;
  lowStock: boolean;
  nextExpiry: string | null;
  version: number;
}

export interface MedicationRequest {
  name: string;
  genericName: string | null;
  dosageForm: DosageForm;
  strength: string | null;
  dispensingUnit: string;
  requiresPrescription: boolean;
  minStockLevel: number;
  version: number | null;
}

export interface Batch {
  id: string;
  medicationId: string;
  medicationName: string | null;
  batchNumber: string;
  expiryDate: string;
  quantityReceived: number;
  quantityAvailable: number;
  unitCost: number | null;
  supplier: string | null;
  receivedAt: string;
  receivedByName: string | null;
  expired: boolean;
  daysToExpiry: number;
}

export interface Movement {
  id: string;
  batchId: string;
  batchNumber: string | null;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  patientId: string | null;
  episodeId: string | null;
  referenceId: string | null;
  reason: string | null;
  performedByName: string | null;
  performedAt: string;
}

export interface DispenseResult {
  medicationId: string;
  medicationName: string;
  quantity: number;
  lines: { batchId: string; batchNumber: string; expiryDate: string; quantity: number }[];
  remaining: number;
}

export interface StockAlerts {
  lowStock: Medication[];
  expiringSoon: Batch[];
  expired: Batch[];
}

export function medicationLabel(m: Pick<Medication, 'name' | 'strength'>): string {
  return m.strength ? `${m.name} ${m.strength}` : m.name;
}
