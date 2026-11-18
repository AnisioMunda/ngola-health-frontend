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
  prescriptionsRead: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'PHARMACIST'],
  prescribe: ['DOCTOR'],
  labRead: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN'],
  labCatalog: ['ADMIN', 'LAB_TECHNICIAN'],
  labRequest: ['DOCTOR'],
  labCollect: ['NURSE', 'LAB_TECHNICIAN'],
  labTechnician: ['LAB_TECHNICIAN'],
  scheduleRead: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
  scheduleManage: ['ADMIN', 'MANAGER'],
  scheduleBlock: ['ADMIN', 'MANAGER', 'DOCTOR'],
  appointmentBook: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
  inpatientRead: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'RECEPTIONIST'],
  wardManage: ['ADMIN', 'MANAGER'],
  bedKeep: ['ADMIN', 'MANAGER', 'NURSE'],
  admit: ['DOCTOR'],
  bedTransfer: ['DOCTOR', 'NURSE'],
  financeRead: ['ADMIN', 'MANAGER', 'FINANCIAL', 'RECEPTIONIST'],
  billing: ['ADMIN', 'FINANCIAL', 'RECEPTIONIST'],
  financeSupervise: ['ADMIN', 'FINANCIAL'],
  priceManage: ['ADMIN', 'FINANCIAL'],
  staff: [
    'ADMIN',
    'MANAGER',
    'DOCTOR',
    'NURSE',
    'RECEPTIONIST',
    'PHARMACIST',
    'FINANCIAL',
    'LAB_TECHNICIAN',
  ],
  hrManage: ['ADMIN', 'MANAGER'],
  equipmentManage: ['ADMIN', 'MANAGER'],
  reportsRead: ['ADMIN', 'MANAGER'],
  financialReports: ['ADMIN', 'MANAGER', 'FINANCIAL'],
} as const satisfies Record<string, readonly Role[]>;
