export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PHARMACIST'
  | 'FINANCIAL'
  | 'LAB_TECHNICIAN'
  | 'PATIENT';

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Administrador da plataforma',
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  DOCTOR: 'Médico',
  NURSE: 'Enfermeiro',
  RECEPTIONIST: 'Recepcionista',
  PHARMACIST: 'Farmacêutico',
  FINANCIAL: 'Financeiro',
  LAB_TECHNICIAN: 'Técnico de laboratório',
  PATIENT: 'Paciente',
};

/** Perfis atribuíveis a utilizadores de um hospital (o paciente pertence ao portal). */
export const STAFF_ROLES: Role[] = [
  'ADMIN',
  'MANAGER',
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST',
  'PHARMACIST',
  'FINANCIAL',
  'LAB_TECHNICIAN',
];

/** Quem acede a cada área (espelha as regras do backend, que são as que valem). */
export const ACCESS = {
  hospitals: ['SUPER_ADMIN'],
  usersRead: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  usersManage: ['SUPER_ADMIN', 'ADMIN'],
  audit: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  patientsRead: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
  patientsWrite: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
  patientsAdmin: ['ADMIN'],
  episodesSchedule: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
  episodesCare: ['DOCTOR', 'NURSE'],
  episodesDoctor: ['DOCTOR'],
  triageStaff: ['DOCTOR', 'NURSE'],
  triageDesk: ['DOCTOR', 'NURSE', 'RECEPTIONIST'],
  pharmacyRead: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'PHARMACIST'],
  catalogManage: ['ADMIN', 'PHARMACIST'],
  pharmacist: ['PHARMACIST'],
} as const satisfies Record<string, readonly Role[]>;
