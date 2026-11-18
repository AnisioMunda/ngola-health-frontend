import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    title: 'Equipamentos · Ngola Health',
    loadComponent: () => import('./equipment-list/equipment-list').then((m) => m.EquipmentList),
  },
  {
    path: 'new',
    title: 'Novo equipamento · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.equipmentManage },
    loadComponent: () => import('./equipment-form/equipment-form').then((m) => m.EquipmentForm),
  },
  {
    path: ':id',
    title: 'Equipamento · Ngola Health',
    loadComponent: () =>
      import('./equipment-detail/equipment-detail').then((m) => m.EquipmentDetail),
  },
  {
    path: ':id/edit',
    title: 'Editar equipamento · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.equipmentManage },
    loadComponent: () => import('./equipment-form/equipment-form').then((m) => m.EquipmentForm),
  },
];
