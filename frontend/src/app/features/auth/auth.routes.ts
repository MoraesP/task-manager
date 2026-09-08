import { Routes } from '@angular/router';
import { guestGuard } from '@core/auth/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'entrar',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'convite',
    loadComponent: () =>
      import('./pages/accept-invitation/accept-invitation.page').then((m) => m.AcceptInvitationPage),
  },
];
