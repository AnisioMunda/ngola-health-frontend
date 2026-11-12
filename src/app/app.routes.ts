import { Routes } from '@angular/router';

import { authGuard, guestGuard, passwordChangedGuard, roleGuard } from './core/auth/auth.guards';
import { ACCESS } from './core/auth/roles';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar · Ngola Health',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'change-password',
    title: 'Alterar senha · Ngola Health',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/change-password/change-password').then((m) => m.ChangePassword),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard, passwordChangedGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        title: 'Início · Ngola Health',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'hospitals',
        canActivate: [roleGuard],
        data: { roles: ACCESS.hospitals },
        loadChildren: () =>
          import('./features/hospitals/hospitals.routes').then((m) => m.HOSPITAL_ROUTES),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ACCESS.usersRead },
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'patients',
        canActivate: [roleGuard],
        data: { roles: ACCESS.patientsRead },
        loadChildren: () =>
          import('./features/patients/patients.routes').then((m) => m.PATIENT_ROUTES),
      },
      {
        path: 'triage',
        canActivate: [roleGuard],
        data: { roles: ACCESS.patientsRead },
        loadChildren: () => import('./features/triage/triage.routes').then((m) => m.TRIAGE_ROUTES),
      },
      {
        path: 'episodes',
        canActivate: [roleGuard],
        data: { roles: ACCESS.patientsRead },
        loadChildren: () =>
          import('./features/episodes/episodes.routes').then((m) => m.EPISODE_ROUTES),
      },
      {
        path: 'pharmacy',
        canActivate: [roleGuard],
        data: { roles: ACCESS.pharmacyRead },
        loadChildren: () =>
          import('./features/pharmacy/pharmacy.routes').then((m) => m.PHARMACY_ROUTES),
      },
      {
        path: 'prescriptions',
        canActivate: [roleGuard],
        data: { roles: ACCESS.prescriptionsRead },
        loadChildren: () =>
          import('./features/prescriptions/prescriptions.routes').then(
            (m) => m.PRESCRIPTION_ROUTES,
          ),
      },
      {
        path: 'lab',
        canActivate: [roleGuard],
        data: { roles: ACCESS.labRead },
        loadChildren: () =>
          import('./features/laboratory/laboratory.routes').then((m) => m.LAB_ROUTES),
      },
      {
        path: 'notifications',
        title: 'Notificações · Ngola Health',
        loadComponent: () =>
          import('./features/notifications/notification-list/notification-list').then(
            (m) => m.NotificationList,
          ),
      },
      {
        path: 'audit',
        title: 'Auditoria · Ngola Health',
        canActivate: [roleGuard],
        data: { roles: ACCESS.audit },
        loadComponent: () =>
          import('./features/audit/audit-list/audit-list').then((m) => m.AuditList),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
