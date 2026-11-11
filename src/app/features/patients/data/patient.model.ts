export type Gender = 'MALE' | 'FEMALE';

export const GENDER_LABELS: Record<Gender, string> = { MALE: 'Masculino', FEMALE: 'Feminino' };

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export interface PatientSummary {
  id: string;
  recordNumber: string;
  fullName: string;
  birthDate: string;
  age: number;
  gender: Gender;
  nationalId: string | null;
  phone: string | null;
  active: boolean;
}

export interface Patient extends PatientSummary {
  healthCardNumber: string | null;
  email: string | null;
  address: string | null;
  province: string | null;
  municipality: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatientRequest {
  fullName: string;
  birthDate: string;
  gender: Gender;
  nationalId: string | null;
  healthCardNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  province: string | null;
  municipality: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  notes: string | null;
  version: number | null;
}

export interface DuplicateCheck {
  fullName: string;
  birthDate: string;
  nationalId: string | null;
  phone: string | null;
}
