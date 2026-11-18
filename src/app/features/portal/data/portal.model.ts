export interface PortalProfile {
  fullName: string;
  recordNumber: string;
  birthDate: string;
  hospitalName: string | null;
  phone: string | null;
  email: string | null;
}

export interface PortalAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  doctorName: string;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'EXAM';
  status: 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';
  reason: string;
  cancellable: boolean;
}

export interface PortalResult {
  testName: string;
  value: string;
  unit: string | null;
  reference: string | null;
  flag: 'NORMAL' | 'LOW' | 'HIGH' | 'ABNORMAL' | null;
  validatedAt: string;
}

export interface PortalLabRequest {
  id: string;
  number: string;
  requestedAt: string;
  requestedByName: string;
  status: string;
  results: PortalResult[];
  pending: number;
}

export interface PortalPrescription {
  id: string;
  number: string;
  prescribedAt: string;
  doctorName: string;
  status: string;
  validUntil: string;
  items: { medication: string; dosage: string; status: 'PENDING' | 'DISPENSED' }[];
}

export interface PortalInvoice {
  id: string;
  documentType: 'FT' | 'FR' | 'NC';
  number: string;
  status: string;
  issuedAt: string;
  total: number;
  balance: number;
  dueDate: string | null;
}

export interface PortalStatus {
  hasAccount: boolean;
  accountActive: boolean;
  username: string | null;
  email: string | null;
  lastLoginAt: string | null;
  pendingCodeExpiresAt: string | null;
}

export const APPOINTMENT_STATUS: Record<PortalAppointment['status'], string> = {
  SCHEDULED: 'Marcada',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Realizada',
  NO_SHOW: 'Faltou',
  CANCELLED: 'Cancelada',
};

export const APPOINTMENT_TYPE: Record<PortalAppointment['type'], string> = {
  CONSULTATION: 'Consulta',
  FOLLOW_UP: 'Consulta de seguimento',
  EXAM: 'Exame',
};

export const FLAG_LABELS: Record<string, string> = {
  LOW: 'Abaixo da referência',
  HIGH: 'Acima da referência',
  ABNORMAL: 'Alterado',
};

export const DOCUMENT_LABELS: Record<PortalInvoice['documentType'], string> = {
  FT: 'Factura',
  FR: 'Factura-recibo',
  NC: 'Nota de crédito',
};

export const INVOICE_STATUS: Record<string, string> = {
  ISSUED: 'Por pagar',
  PARTIALLY_PAID: 'Paga em parte',
  PAID: 'Paga',
  CANCELLED: 'Anulada',
  CREDITED: 'Creditada',
};

export const PRESCRIPTION_STATUS: Record<string, string> = {
  ACTIVE: 'Por levantar',
  PARTIALLY_DISPENSED: 'Levantada em parte',
  DISPENSED: 'Levantada',
  EXPIRED: 'Expirada',
};
