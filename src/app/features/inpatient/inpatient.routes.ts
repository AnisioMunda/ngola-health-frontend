import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const INPATIENT_ROUTES: Routes = [
  {
    path: '',
    title: 'Internamento · Ngola Health',
    loadComponent: () => import('./ward-board/ward-board').then((m) => m.WardBoard),
  },
  {
    path: 'wards/:id',
    title: 'Mapa de camas · Ngola Health',
    loadComponent: () => import('./ward-map/ward-map').then((m) => m.WardMap),
  },
  {
    path: 'admissions',
    title: 'Internamentos · Ngola Health',
    loadComponent: () => import('./admission-list/admission-list').then((m) => m.AdmissionList),
  },
  {
    path: 'admissions/:id',
    title: 'Internamento · Ngola Health',
    loadComponent: () =>
      import('./admission-detail/admission-detail').then((m) => m.AdmissionDetail),
  },
  {
    path: 'episode/:episodeId',
    loadComponent: () =>
      import('./admission-by-episode/admission-by-episode').then((m) => m.AdmissionByEpisode),
  },
  {
    path: 'admit',
    title: 'Internar · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.admit },
    loadComponent: () => import('./admit-form/admit-form').then((m) => m.AdmitForm),
  },
  {
    path: 'manage',
    title: 'Enfermarias e camas · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.wardManage },
    loadComponent: () => import('./ward-admin/ward-admin').then((m) => m.WardAdmin),
  },
];
