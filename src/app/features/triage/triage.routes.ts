import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const TRIAGE_ROUTES: Routes = [
  {
    path: '',
    title: 'Triagem · Ngola Health',
    loadComponent: () => import('./triage-board/triage-board').then((m) => m.TriageBoard),
  },
  {
    path: 'new',
    title: 'Nova triagem · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.triageStaff },
    loadComponent: () => import('./triage-form/triage-form').then((m) => m.TriageForm),
  },
  {
    path: ':id',
    title: 'Triagem · Ngola Health',
    loadComponent: () => import('./triage-detail/triage-detail').then((m) => m.TriageDetail),
  },
];
