import { Routes } from '@angular/router';

import { roleGuard } from '../../core/auth/auth.guards';
import { ACCESS } from '../../core/auth/roles';

export const EPISODE_ROUTES: Routes = [
  {
    path: '',
    title: 'Episódios · Ngola Health',
    loadComponent: () => import('./episode-list/episode-list').then((m) => m.EpisodeList),
  },
  {
    path: 'new',
    title: 'Novo episódio · Ngola Health',
    canActivate: [roleGuard],
    data: { roles: ACCESS.episodesSchedule },
    loadComponent: () => import('./episode-form/episode-form').then((m) => m.EpisodeForm),
  },
  {
    path: ':id',
    title: 'Episódio · Ngola Health',
    loadComponent: () => import('./episode-detail/episode-detail').then((m) => m.EpisodeDetail),
  },
];
