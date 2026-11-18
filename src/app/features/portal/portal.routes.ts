import { Routes } from '@angular/router';

import { PortalShell } from './portal-shell/portal-shell';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    component: PortalShell,
    children: [
      {
        path: '',
        title: 'O meu portal · Ngola Health',
        loadComponent: () => import('./home/home').then((m) => m.PortalHome),
      },
      {
        path: 'appointments',
        title: 'Consultas · O meu portal',
        loadComponent: () =>
          import('./appointments/appointments').then((m) => m.PortalAppointments),
      },
      {
        path: 'results',
        title: 'Resultados · O meu portal',
        loadComponent: () => import('./results/results').then((m) => m.PortalResults),
      },
      {
        path: 'prescriptions',
        title: 'Receitas · O meu portal',
        loadComponent: () =>
          import('./prescriptions/prescriptions').then((m) => m.PortalPrescriptions),
      },
    ],
  },
];
