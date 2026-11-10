import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hospitals' },
  {
    path: 'hospitals',
    loadChildren: () =>
      import('./features/hospitals/hospitals.routes').then((m) => m.HOSPITAL_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
