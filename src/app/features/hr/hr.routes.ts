import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const HR_ROUTES: Routes = [
  {
    path: '',
    title: 'Recursos humanos · Ngola Health',
    loadComponent: () => import('./hr-home/hr-home').then((m) => m.HrHome),
  },
  {
    path: 'schedule',
    title: 'Escala · Ngola Health',
    loadComponent: () => import('./schedule/schedule').then((m) => m.Schedule),
  },
  {
    path: 'leaves',
    title: 'Folgas e férias · Ngola Health',
    loadComponent: () => import('./leaves/leaves').then((m) => m.Leaves),
  },
  {
    path: 'attendance',
    title: 'Registos de ponto · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.hrManage },
    loadComponent: () => import('./attendance/attendance').then((m) => m.AttendancePage),
  },
];
