export type TestCategory =
  | 'HEMATOLOGY'
  | 'BIOCHEMISTRY'
  | 'MICROBIOLOGY'
  | 'PARASITOLOGY'
  | 'IMMUNOLOGY'
  | 'SEROLOGY'
  | 'URINALYSIS'
  | 'OTHER';
export type SampleType =
  'BLOOD' | 'SERUM' | 'PLASMA' | 'URINE' | 'STOOL' | 'SWAB' | 'SPUTUM' | 'CSF' | 'OTHER';
export type ResultType = 'NUMERIC' | 'QUALITATIVE';
export type LabPriority = 'ROUTINE' | 'URGENT';
export type LabRequestStatus = 'PENDING' | 'COLLECTED' | 'IN_ANALYSIS' | 'COMPLETED' | 'CANCELLED';
export type ItemStatus = 'PENDING' | 'RESULTED' | 'VALIDATED' | 'CANCELLED';
export type ResultFlag = 'NORMAL' | 'LOW' | 'HIGH' | 'ABNORMAL';

export const CATEGORY_LABELS: Record<TestCategory, string> = {
  HEMATOLOGY: 'Hematologia',
  BIOCHEMISTRY: 'Bioquímica',
  MICROBIOLOGY: 'Microbiologia',
  PARASITOLOGY: 'Parasitologia',
  IMMUNOLOGY: 'Imunologia',
  SEROLOGY: 'Serologia',
  URINALYSIS: 'Urina',
  OTHER: 'Outros',
};

export const SAMPLE_LABELS: Record<SampleType, string> = {
  BLOOD: 'Sangue total',
  SERUM: 'Soro',
  PLASMA: 'Plasma',
  URINE: 'Urina',
  STOOL: 'Fezes',
  SWAB: 'Zaragatoa',
  SPUTUM: 'Expectoração',
  CSF: 'Líquor',
  OTHER: 'Outra',
};

export const LAB_STATUS_LABELS: Record<LabRequestStatus, string> = {
  PENDING: 'Aguarda colheita',
  COLLECTED: 'Colhido',
  IN_ANALYSIS: 'Em análise',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  PENDING: 'Pendente',
  RESULTED: 'Por validar',
  VALIDATED: 'Validado',
  CANCELLED: 'Cancelado',
};

export const FLAG_LABELS: Record<ResultFlag, string> = {
  NORMAL: 'Normal',
  LOW: 'Baixo ↓',
  HIGH: 'Alto ↑',
  ABNORMAL: 'Alterado',
};

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: TestCategory;
  sampleType: SampleType;
  resultType: ResultType;
  unit: string | null;
  referenceLow: number | null;
  referenceHigh: number | null;
  referenceText: string | null;
  turnaroundHours: number;
  active: boolean;
  version: number;
}

export type LabTestRequest = Omit<LabTest, 'id' | 'active' | 'version'> & {
  version: number | null;
};

export interface Amendment {
  previousNumeric: number | null;
  previousText: string | null;
  previousFlag: ResultFlag | null;
  newNumeric: number | null;
  newText: string | null;
  newFlag: ResultFlag | null;
  reason: string;
  amendedByName: string | null;
  amendedAt: string;
}

export interface LabItem {
  id: string;
  labTestId: string;
  testCode: string;
  testName: string;
  resultType: ResultType;
  unit: string | null;
  referenceLow: number | null;
  referenceHigh: number | null;
  referenceText: string | null;
  status: ItemStatus;
  resultVisible: boolean;
  numericValue: number | null;
  textValue: string | null;
  flag: ResultFlag | null;
  resultNotes: string | null;
  resultedAt: string | null;
  resultedByName: string | null;
  validatedAt: string | null;
  validatedByName: string | null;
  amended: boolean;
  amendments: Amendment[];
}

export interface LabRequest {
  id: string;
  number: string;
  patientId: string;
  patientName: string | null;
  patientRecordNumber: string | null;
  episodeId: string;
  requestedByName: string | null;
  requestedAt: string;
  priority: LabPriority;
  clinicalInfo: string | null;
  status: LabRequestStatus;
  collectedAt: string | null;
  collectedByName: string | null;
  collectionNotes: string | null;
  analysisStartedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledByName: string | null;
  cancellationReason: string | null;
  hasAbnormal: boolean;
  items: LabItem[];
  version: number;
}

export interface ResultInput {
  numericValue: number | null;
  textValue: string | null;
  abnormal: boolean;
  notes: string | null;
}

/** Intervalo de referência legível (ex.: "12 – 16 g/dL", "≤ 5", "Negativo"). */
export function referenceLabel(
  i: Pick<LabItem, 'referenceLow' | 'referenceHigh' | 'referenceText' | 'unit'>,
): string {
  const unit = i.unit ? ` ${i.unit}` : '';
  if (i.referenceLow !== null && i.referenceHigh !== null)
    return `${i.referenceLow} – ${i.referenceHigh}${unit}`;
  if (i.referenceLow !== null) return `≥ ${i.referenceLow}${unit}`;
  if (i.referenceHigh !== null) return `≤ ${i.referenceHigh}${unit}`;
  return i.referenceText ?? '—';
}
