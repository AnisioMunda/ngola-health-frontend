import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    title: 'Dashboard · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.reportsRead },
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
];

export const REPORT_ROUTES: Routes = [
  {
    path: '',
    title: 'Relatórios · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.reportsRead },
    loadComponent: () => import('./reports-page/reports-page').then((m) => m.ReportsPage),
  },
];
