export type EquipmentCategory =
  | 'DIAGNOSTIC'
  | 'THERAPEUTIC'
  | 'SURGICAL'
  | 'MONITORING'
  | 'LIFE_SUPPORT'
  | 'LABORATORY'
  | 'IMAGING'
  | 'MOBILITY'
  | 'IT'
  | 'OTHER';
export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH';
export type EquipmentStatus = 'OPERATIONAL' | 'OUT_OF_SERVICE' | 'UNDER_MAINTENANCE' | 'RETIRED';
export type FaultStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'INSPECTION';
export type MaintenanceResult = 'PASSED' | 'FAILED';

export interface EquipmentSummary {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  criticality: Criticality;
  status: EquipmentStatus;
  wardName: string | null;
  location: string | null;
  nextMaintenanceDate: string | null;
  nextCalibrationDate: string | null;
  maintenanceOverdue: boolean;
  calibrationOverdue: boolean;
  openFaults: number;
}

export interface Fault {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  criticality: Criticality;
  description: string;
  outOfService: boolean;
  status: FaultStatus;
  reportedByName: string;
  reportedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

export interface Maintenance {
  id: string;
  faultId: string | null;
  type: MaintenanceType;
  performedOn: string;
  performedBy: string;
  description: string;
  partsReplaced: string | null;
  cost: number | null;
  result: MaintenanceResult;
  recordedByName: string;
  recordedAt: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  criticality: Criticality;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  wardId: string | null;
  wardName: string | null;
  location: string | null;
  status: EquipmentStatus;
  purchaseDate: string | null;
  purchasePrice: number | null;
  warrantyUntil: string | null;
  underWarranty: boolean;
  maintenanceIntervalDays: number | null;
  nextMaintenanceDate: string | null;
  maintenanceOverdue: boolean;
  calibrationIntervalDays: number | null;
  nextCalibrationDate: string | null;
  calibrationOverdue: boolean;
  notes: string | null;
  retiredAt: string | null;
  retiredByName: string | null;
  retirementReason: string | null;
  faults: Fault[];
  maintenance: Maintenance[];
  maintenanceCostTotal: number;
  version: number;
}

export interface EquipmentRequest {
  code: string;
  name: string;
  category: EquipmentCategory;
  criticality: Criticality;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  wardId: string | null;
  location: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  warrantyUntil: string | null;
  maintenanceIntervalDays: number | null;
  nextMaintenanceDate: string | null;
  calibrationIntervalDays: number | null;
  nextCalibrationDate: string | null;
  notes: string | null;
  version: number | null;
}

export interface EquipmentOverview {
  operational: number;
  outOfService: number;
  underMaintenance: number;
  retired: number;
  openFaults: number;
  dueIn30Days: number;
}

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  DIAGNOSTIC: 'Diagnóstico',
  THERAPEUTIC: 'Terapêutica',
  SURGICAL: 'Cirúrgico',
  MONITORING: 'Monitorização',
  LIFE_SUPPORT: 'Suporte de vida',
  LABORATORY: 'Laboratório',
  IMAGING: 'Imagiologia',
  MOBILITY: 'Mobilidade',
  IT: 'Informática',
  OTHER: 'Outro',
};

export const CRITICALITY_LABELS: Record<Criticality, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  OPERATIONAL: 'Operacional',
  OUT_OF_SERVICE: 'Fora de serviço',
  UNDER_MAINTENANCE: 'Em manutenção',
  RETIRED: 'Abatido',
};

export const FAULT_STATUS_LABELS: Record<FaultStatus, string> = {
  OPEN: 'Aberta',
  RESOLVED: 'Resolvida',
  DISMISSED: 'Descartada',
};

export const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVE: 'Preventiva',
  CORRECTIVE: 'Correctiva',
  CALIBRATION: 'Calibração',
  INSPECTION: 'Inspecção',
};
