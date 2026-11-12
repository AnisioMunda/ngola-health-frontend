import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const PRESCRIPTION_ROUTES: Routes = [
  {
    path: '',
    title: 'Prescrições · Ngola Health',
    loadComponent: () =>
      import('./prescription-list/prescription-list').then((m) => m.PrescriptionList),
  },
  {
    path: 'new',
    title: 'Nova prescrição · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.prescribe },
    loadComponent: () =>
      import('./prescription-form/prescription-form').then((m) => m.PrescriptionForm),
  },
  {
    path: ':id',
    title: 'Prescrição · Ngola Health',
    loadComponent: () =>
      import('./prescription-detail/prescription-detail').then((m) => m.PrescriptionDetail),
  },
];
