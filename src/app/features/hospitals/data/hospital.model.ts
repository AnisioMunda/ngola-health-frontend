export type HospitalType = 'HOSPITAL' | 'CLINIC' | 'POLYCLINIC' | 'HEALTH_CENTER' | 'LABORATORY';

export interface Hospital {
  id: string;
  name: string;
  code: string;
  type: HospitalType;
  province: string;
  municipality: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalRequest {
  name: string;
  code: string;
  type: HospitalType;
  province: string;
  municipality: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  /** Versão lida ao abrir o formulário; o backend recusa a gravação se entretanto mudou. */
  version: number | null;
}

export interface HospitalSearch {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

export const HOSPITAL_TYPE_LABELS: Record<HospitalType, string> = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clínica',
  POLYCLINIC: 'Policlínica',
  HEALTH_CENTER: 'Centro de saúde',
  LABORATORY: 'Laboratório',
};

export const HOSPITAL_TYPES = Object.entries(HOSPITAL_TYPE_LABELS).map(([value, label]) => ({
  value: value as HospitalType,
  label,
}));

/** Províncias de Angola (divisão de 2024), sugeridas no formulário. */
export const ANGOLA_PROVINCES = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cubango',
  'Cunene',
  'Huambo',
  'Huíla',
  'Icolo e Bengo',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Moxico Leste',
  'Namibe',
  'Uíge',
  'Zaire',
] as const;
