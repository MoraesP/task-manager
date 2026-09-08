import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'convite',
    loadComponent: () => import('./auth/accept-invitation').then((m) => m.AcceptInvitationComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/shell').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'projetos' },
      {
        path: 'projetos',
        pathMatch: 'full',
        loadComponent: () => import('./projects/projects-list').then((m) => m.ProjectsListComponent),
      },
      {
        path: 'projetos/:projectId',
        loadComponent: () => import('./project/project-layout').then((m) => m.ProjectLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'quadro' },
          {
            path: 'quadro',
            loadComponent: () => import('./board/board-page').then((m) => m.BoardPageComponent),
          },
          {
            path: 'relatorio',
            loadComponent: () => import('./report/report-page').then((m) => m.ReportPageComponent),
          },
          {
            path: 'membros',
            loadComponent: () => import('./members/members-page').then((m) => m.MembersPageComponent),
          },
          {
            path: 'configuracoes',
            loadComponent: () =>
              import('./project/project-settings').then((m) => m.ProjectSettingsComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
