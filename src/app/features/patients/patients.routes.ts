import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    title: 'Pacientes · Ngola Health',
    loadComponent: () => import('./patient-list/patient-list').then((m) => m.PatientList),
  },
  {
    path: 'new',
    title: 'Registar paciente · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.patientsWrite },
    loadComponent: () => import('./patient-form/patient-form').then((m) => m.PatientForm),
  },
  {
    path: ':id',
    title: 'Ficha do paciente · Ngola Health',
    loadComponent: () => import('./patient-detail/patient-detail').then((m) => m.PatientDetail),
  },
  {
    path: ':id/edit',
    title: 'Editar paciente · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.patientsWrite },
    loadComponent: () => import('./patient-form/patient-form').then((m) => m.PatientForm),
  },
];
