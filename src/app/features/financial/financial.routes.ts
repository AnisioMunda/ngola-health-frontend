import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const FINANCIAL_ROUTES: Routes = [
  {
    path: '',
    title: 'Financeiro · Ngola Health',
    loadComponent: () => import('./invoice-list/invoice-list').then((m) => m.InvoiceList),
  },
  {
    path: 'new',
    title: 'Novo documento · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.billing },
    loadComponent: () => import('./invoice-form/invoice-form').then((m) => m.InvoiceForm),
  },
  {
    path: 'invoices/:id',
    title: 'Documento · Ngola Health',
    loadComponent: () => import('./invoice-detail/invoice-detail').then((m) => m.InvoiceDetail),
  },
  {
    path: 'invoices/:id/edit',
    title: 'Editar rascunho · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.billing },
    loadComponent: () => import('./invoice-form/invoice-form').then((m) => m.InvoiceForm),
  },
  {
    path: 'prices',
    title: 'Tabela de preços · Ngola Health',
    loadComponent: () => import('./price-catalog/price-catalog').then((m) => m.PriceCatalog),
  },
  {
    path: 'cash',
    title: 'Caixa do dia · Ngola Health',
    loadComponent: () => import('./cash-summary/cash-summary').then((m) => m.CashSummary),
  },
];
