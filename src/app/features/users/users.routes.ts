import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const USER_ROUTES: Routes = [
  {
    path: '',
    title: 'Utilizadores · Ngola Health',
    loadComponent: () => import('./user-list/user-list').then((m) => m.UserList),
  },
  {
    path: 'new',
    title: 'Novo utilizador · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.usersManage },
    loadComponent: () => import('./user-form/user-form').then((m) => m.UserForm),
  },
  {
    path: ':id/edit',
    title: 'Editar utilizador · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.usersManage },
    loadComponent: () => import('./user-form/user-form').then((m) => m.UserForm),
  },
];
