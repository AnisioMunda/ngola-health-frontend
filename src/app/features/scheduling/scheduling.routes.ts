import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const SCHEDULING_ROUTES: Routes = [
  {
    path: '',
    title: 'Agenda · Ngola Health',
    loadComponent: () => import('./agenda-day/agenda-day').then((m) => m.AgendaDay),
  },
  {
    path: 'calendar',
    title: 'Calendário · Ngola Health',
    loadComponent: () => import('./month-calendar/month-calendar').then((m) => m.MonthCalendar),
  },
  {
    path: 'schedules',
    title: 'Horários e ausências · Ngola Health',
    loadComponent: () => import('./schedule-admin/schedule-admin').then((m) => m.ScheduleAdmin),
  },
  {
    path: 'new',
    title: 'Nova marcação · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.appointmentBook },
    loadComponent: () =>
      import('./appointment-form/appointment-form').then((m) => m.AppointmentForm),
  },
  {
    path: 'appointments/:id',
    title: 'Marcação · Ngola Health',
    loadComponent: () =>
      import('./appointment-detail/appointment-detail').then((m) => m.AppointmentDetail),
  },
];
