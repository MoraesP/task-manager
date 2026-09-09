import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const guardaAutenticacao: CanActivateFn = (_rota, estado) => {
  const autenticacao = inject(AuthService);
  const roteador = inject(Router);
  if (autenticacao.estaAutenticado()) {
    return true;
  }
  return roteador.createUrlTree(['/entrar'], { queryParams: { retorno: estado.url } });
};

export const guardaVisitante: CanActivateFn = () => {
  const autenticacao = inject(AuthService);
  const roteador = inject(Router);
  return autenticacao.estaAutenticado() ? roteador.createUrlTree(['/projetos']) : true;
};
