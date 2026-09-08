import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';

/** Rotas autenticadas, todas dentro do shell (sidebar + conteúdo). */
export const SHELL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'projetos' },
      {
        path: 'projetos',
        loadChildren: () => import('@features/projects/projects.routes').then((m) => m.PROJECTS_ROUTES),
      },
    ],
  },
];
