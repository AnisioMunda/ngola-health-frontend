import { Routes } from '@angular/router';

export const HOSPITAL_ROUTES: Routes = [
  {
    path: '',
    title: 'Hospitais · Ngola Health',
    loadComponent: () => import('./hospital-list/hospital-list').then((m) => m.HospitalList),
  },
  {
    path: 'new',
    title: 'Registar hospital · Ngola Health',
    loadComponent: () => import('./hospital-form/hospital-form').then((m) => m.HospitalForm),
  },
  {
    path: ':id/edit',
    title: 'Editar hospital · Ngola Health',
    loadComponent: () => import('./hospital-form/hospital-form').then((m) => m.HospitalForm),
  },
];
