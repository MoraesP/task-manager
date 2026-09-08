import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/project-layout/project-layout.page').then((m) => m.ProjectLayoutPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'quadro' },
      {
        path: 'quadro',
        loadChildren: () => import('@features/board/board.routes').then((m) => m.BOARD_ROUTES),
      },
      {
        path: 'relatorio',
        loadChildren: () => import('@features/report/report.routes').then((m) => m.REPORT_ROUTES),
      },
      {
        path: 'membros',
        loadChildren: () => import('@features/members/members.routes').then((m) => m.MEMBERS_ROUTES),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./pages/project-settings/project-settings.page').then((m) => m.ProjectSettingsPage),
      },
    ],
  },
];
