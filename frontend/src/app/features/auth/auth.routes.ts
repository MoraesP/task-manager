import { Routes } from '@angular/router';
import { guardaVisitante } from '@core/auth/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'entrar',
    canActivate: [guardaVisitante],
    loadComponent: () => import('./pages/login/login.page').then((modulo) => modulo.LoginPage),
  },
  {
    path: 'cadastro',
    canActivate: [guardaVisitante],
    loadComponent: () => import('./pages/register/register.page').then((modulo) => modulo.RegisterPage),
  },
  {
    path: 'convite',
    loadComponent: () =>
      import('./pages/accept-invitation/accept-invitation.page').then((modulo) => modulo.AcceptInvitationPage),
  },
];
