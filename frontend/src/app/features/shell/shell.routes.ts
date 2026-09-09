import { Routes } from '@angular/router';
import { guardaAutenticacao } from '@core/auth/auth.guard';

/** Rotas autenticadas, todas dentro do shell (sidebar + conteúdo). */
export const SHELL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [guardaAutenticacao],
    loadComponent: () =>
      import('./pages/shell/shell.component').then((modulo) => modulo.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'projetos' },
      {
        path: 'projetos',
        loadChildren: () =>
          import('@features/projects/projects.routes').then((modulo) => modulo.PROJECTS_ROUTES),
      },
    ],
  },
];
