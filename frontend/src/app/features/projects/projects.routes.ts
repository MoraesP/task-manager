import { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/projects-list/projects-list.page').then((m) => m.ProjectsListPage),
  },
  {
    path: ':projectId',
    loadChildren: () => import('@features/project/project.routes').then((m) => m.PROJECT_ROUTES),
  },
];
