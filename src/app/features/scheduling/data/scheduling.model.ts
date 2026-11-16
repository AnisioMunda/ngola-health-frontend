export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';
export type AppointmentType = 'CONSULTATION' | 'FOLLOW_UP' | 'EXAM';
export type DayOfWeek =
  'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type SlotState = 'FREE' | 'FULL' | 'BLOCKED' | 'PAST';

export interface Schedule {
  id: string;
  doctorId: string;
  doctorName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacity: number;
  slotsPerDay: number;
  active: boolean;
  futureAppointments: number | null;
}

export interface ScheduleRequest {
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacity: number;
}

export interface Block {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  reason: string;
  createdByName: string;
  affectedAppointments: Appointment[];
}

export interface BlockRequest {
  doctorId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  state: SlotState;
}

export interface DayAvailability {
  date: string;
  doctorId: string;
  doctorName: string;
  slots: Slot[];
  freeSlots: number;
  blocks: Block[];
}

export interface DaySummary {
  date: string;
  totalSlots: number;
  freeSlots: number;
  appointments: number;
  blockedAllDay: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientRecordNumber: string;
  patientPhone: string | null;
  doctorId: string;
  doctorName: string;
  type: AppointmentType;
  date: string;
  startTime: string;
  endTime: string;
  slotPosition: number;
  status: AppointmentStatus;
  reason: string;
  notes: string | null;
  bookedByName: string;
  bookedAt: string;
  confirmedAt: string | null;
  checkedInAt: string | null;
  episodeId: string | null;
  noShowAt: string | null;
  cancelledAt: string | null;
  cancelledByName: string | null;
  cancellationReason: string | null;
  rescheduledFromId: string | null;
  rescheduledToId: string | null;
  version: number;
}

export interface AppointmentRequest {
  patientId: string;
  doctorId: string;
  type: AppointmentType;
  date: string;
  startTime: string;
  reason: string;
  notes: string | null;
}

export interface RescheduleRequest {
  doctorId: string | null;
  date: string;
  startTime: string;
  reason: string | null;
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Marcada',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Chegou',
  NO_SHOW: 'Faltou',
  CANCELLED: 'Cancelada',
};

export const TYPE_LABELS: Record<AppointmentType, string> = {
  CONSULTATION: 'Consulta',
  FOLLOW_UP: 'Seguimento',
  EXAM: 'Exame',
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export const DAYS: DayOfWeek[] = Object.keys(DAY_LABELS) as DayOfWeek[];

export const SLOT_STATE_LABELS: Record<SlotState, string> = {
  FREE: 'Livre',
  FULL: 'Preenchida',
  BLOCKED: 'Ausência',
  PAST: 'Já passou',
};

/** "09:00:00" → "09:00". */
export function hhmm(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : '';
}

/** Data local (do navegador) no formato ISO, sem fuso: "2026-11-16". */
export function isoDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** Soma dias a uma data ISO, sem problemas de fuso horário. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}

export function isPending(status: AppointmentStatus): boolean {
  return status === 'SCHEDULED' || status === 'CONFIRMED';
}
