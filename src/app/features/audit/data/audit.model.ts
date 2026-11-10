export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'SESSION_REVOKED'
  | 'ACCESS_DENIED'
  | 'REQUEST';

export type AuditEntityType = 'HOSPITAL' | 'USER' | 'SYSTEM';
export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'DENIED';

export interface AuditEvent {
  id: string;
  occurredAt: string;
  hospitalId: string | null;
  actorId: string | null;
  actorUsername: string | null;
  actorName: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  summary: string;
  /** Criação: dados iniciais; edição: {campo: {from, to}}. */
  changes: Record<string, unknown> | null;
  outcome: AuditOutcome;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  requestId: string | null;
}

export interface AuditSearch {
  search?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  outcome?: AuditOutcome;
  hospitalId?: string;
  /** ISO 8601 (inclusivo). */
  from?: string;
  /** ISO 8601 (exclusivo). */
  to?: string;
  page?: number;
  size?: number;
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Criação',
  UPDATE: 'Edição',
  ACTIVATE: 'Activação',
  DEACTIVATE: 'Desactivação',
  LOGIN: 'Início de sessão',
  LOGIN_FAILED: 'Login falhado',
  ACCOUNT_LOCKED: 'Conta bloqueada',
  LOGOUT: 'Fim de sessão',
  PASSWORD_CHANGED: 'Senha alterada',
  PASSWORD_RESET: 'Senha reposta',
  SESSION_REVOKED: 'Sessão revogada',
  ACCESS_DENIED: 'Acesso negado',
  REQUEST: 'Pedido genérico',
};

export const ENTITY_LABELS: Record<AuditEntityType, string> = {
  HOSPITAL: 'Hospital',
  USER: 'Utilizador',
  SYSTEM: 'Sistema',
};

export const OUTCOME_LABELS: Record<AuditOutcome, string> = {
  SUCCESS: 'Sucesso',
  FAILURE: 'Falhou',
  DENIED: 'Recusado',
};

/** Nomes legíveis dos campos que aparecem nas alterações. */
export const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  code: 'Código',
  type: 'Tipo',
  province: 'Província',
  municipality: 'Município',
  address: 'Morada',
  phone: 'Telefone',
  email: 'Correio electrónico',
  taxId: 'NIF',
  active: 'Activo',
  fullName: 'Nome completo',
  username: 'Utilizador',
  roles: 'Perfis',
  hospitalId: 'Hospital (id)',
  hospitalName: 'Hospital',
  specialty: 'Especialidade',
  professionalCardNumber: 'Carteira profissional',
  status: 'Estado',
  mustChangePassword: 'Senha temporária',
  lockedUntil: 'Bloqueado até',
  lastLoginAt: 'Último acesso',
};
