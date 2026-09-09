import { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/projects-list/projects-list.page').then((modulo) => modulo.ProjectsListPage),
  },
  {
    path: ':projectId',
    loadChildren: () => import('@features/project/project.routes').then((modulo) => modulo.PROJECT_ROUTES),
  },
];
