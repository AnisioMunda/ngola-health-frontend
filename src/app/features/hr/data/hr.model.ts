import { Role } from '../../../core/auth/roles';

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FULL_DAY' | 'ON_CALL';
export type ShiftStatus = 'SCHEDULED' | 'CANCELLED';
export type LeaveType =
  | 'VACATION'
  | 'SICK'
  | 'PERSONAL'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'BEREAVEMENT'
  | 'UNPAID'
  | 'COMPENSATORY'
  | 'TRAINING';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PresenceState = 'PRESENT' | 'LATE' | 'ON_DUTY' | 'UPCOMING' | 'ABSENT' | 'ON_LEAVE';

export interface StaffMember {
  id: string;
  fullName: string;
  roles: Role[];
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  type: ShiftType;
  startsAt: string;
  endsAt: string;
  date: string;
  wardId: string | null;
  wardName: string | null;
  department: string | null;
  status: ShiftStatus;
  notes: string | null;
  cancellationReason: string | null;
}

export interface ShiftRequest {
  userId: string;
  type: ShiftType;
  date: string;
  startTime: string;
  endTime: string;
  wardId: string | null;
  department: string | null;
  notes: string | null;
}

export interface Leave {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  shiftId: string | null;
  shiftStartsAt: string | null;
  shiftEndsAt: string | null;
  clockIn: string;
  clockOut: string | null;
  minutesWorked: number | null;
  lateMinutes: number;
  overtimeMinutes: number;
  correctedByName: string | null;
  correctionReason: string | null;
}

export interface DailyPresence {
  shift: Shift;
  state: PresenceState;
  attendance: Attendance | null;
}

export interface Overview {
  onDutyNow: number;
  shiftsToday: number;
  absentToday: number;
  lateToday: number;
  pendingLeaves: number;
  onLeaveToday: number;
}

export const SHIFT_LABELS: Record<ShiftType, string> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  NIGHT: 'Noite',
  FULL_DAY: 'Dia inteiro',
  ON_CALL: 'Prevenção/Banco',
};

/** Horas sugeridas por tipo (editáveis). Fim antes do início = termina no dia seguinte. */
export const SHIFT_DEFAULT_HOURS: Record<ShiftType, [string, string]> = {
  MORNING: ['08:00', '16:00'],
  AFTERNOON: ['16:00', '00:00'],
  NIGHT: ['20:00', '08:00'],
  FULL_DAY: ['08:00', '20:00'],
  ON_CALL: ['08:00', '08:00'],
};

export const LEAVE_LABELS: Record<LeaveType, string> = {
  VACATION: 'Férias',
  SICK: 'Baixa médica',
  PERSONAL: 'Assuntos pessoais',
  MATERNITY: 'Licença de maternidade',
  PATERNITY: 'Licença de paternidade',
  BEREAVEMENT: 'Nojo (luto)',
  UNPAID: 'Sem vencimento',
  COMPENSATORY: 'Folga compensatória',
  TRAINING: 'Formação',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Recusada',
  CANCELLED: 'Cancelada',
};

export const PRESENCE_LABELS: Record<PresenceState, string> = {
  PRESENT: 'Presente',
  LATE: 'Atrasado',
  ON_DUTY: 'Em serviço',
  UPCOMING: 'Por começar',
  ABSENT: 'Falta',
  ON_LEAVE: 'Ausência',
};

/** "485" → "8h05". */
export function hours(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/** Segunda-feira da semana de uma data ISO. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toIso(date);
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toIso(new Date(y, m - 1, d + days));
}

export function toIso(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
