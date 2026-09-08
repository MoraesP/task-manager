import { Routes } from '@angular/router';
import { AUTH_ROUTES } from '@features/auth/auth.routes';
import { SHELL_ROUTES } from '@features/shell/shell.routes';

export const routes: Routes = [
  ...AUTH_ROUTES,
  ...SHELL_ROUTES,
  { path: '**', redirectTo: '' },
];
