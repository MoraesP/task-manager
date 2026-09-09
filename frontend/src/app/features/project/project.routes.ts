import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/project-layout/project-layout.page').then(
        (modulo) => modulo.ProjectLayoutPage,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'quadro' },
      {
        path: 'quadro',
        loadChildren: () =>
          import('@features/board/board.routes').then((modulo) => modulo.BOARD_ROUTES),
      },
      {
        path: 'relatorio',
        loadChildren: () =>
          import('@features/report/report.routes').then((modulo) => modulo.REPORT_ROUTES),
      },
      {
        path: 'membros',
        loadChildren: () =>
          import('@features/members/members.routes').then((modulo) => modulo.MEMBERS_ROUTES),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./pages/project-settings/project-settings.page').then(
            (modulo) => modulo.ProjectSettingsPage,
          ),
      },
    ],
  },
];
