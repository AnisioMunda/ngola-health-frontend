import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const LAB_ROUTES: Routes = [
  {
    path: '',
    title: 'Laboratório · Ngola Health',
    loadComponent: () => import('./lab-worklist/lab-worklist').then((m) => m.LabWorklist),
  },
  {
    path: 'tests',
    title: 'Catálogo de exames · Ngola Health',
    loadComponent: () => import('./lab-catalog/lab-catalog').then((m) => m.LabCatalog),
  },
  {
    path: 'requests/new',
    title: 'Pedir exames · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.labRequest },
    loadComponent: () =>
      import('./lab-request-form/lab-request-form').then((m) => m.LabRequestForm),
  },
  {
    path: 'requests/:id',
    title: 'Pedido de exames · Ngola Health',
    loadComponent: () =>
      import('./lab-request-detail/lab-request-detail').then((m) => m.LabRequestDetail),
  },
];
