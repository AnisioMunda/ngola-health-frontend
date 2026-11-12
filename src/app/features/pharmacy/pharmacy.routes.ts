import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const PHARMACY_ROUTES: Routes = [
  {
    path: '',
    title: 'Farmácia · Ngola Health',
    loadComponent: () => import('./medication-list/medication-list').then((m) => m.MedicationList),
  },
  {
    path: 'alerts',
    title: 'Alertas de stock · Ngola Health',
    loadComponent: () => import('./alerts/alerts').then((m) => m.StockAlertsPage),
  },
  {
    path: 'receive',
    title: 'Receber lote · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.pharmacist },
    loadComponent: () => import('./receive-stock/receive-stock').then((m) => m.ReceiveStock),
  },
  {
    path: 'dispense',
    title: 'Dispensa ao balcão · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.pharmacist },
    loadComponent: () => import('./dispense/dispense').then((m) => m.Dispense),
  },
  {
    path: 'medications/new',
    title: 'Novo medicamento · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.catalogManage },
    loadComponent: () => import('./medication-form/medication-form').then((m) => m.MedicationForm),
  },
  {
    path: 'medications/:id',
    title: 'Medicamento · Ngola Health',
    loadComponent: () =>
      import('./medication-detail/medication-detail').then((m) => m.MedicationDetail),
  },
  {
    path: 'medications/:id/edit',
    title: 'Editar medicamento · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.catalogManage },
    loadComponent: () => import('./medication-form/medication-form').then((m) => m.MedicationForm),
  },
];
