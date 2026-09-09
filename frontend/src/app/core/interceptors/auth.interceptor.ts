import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { TokenResponse } from '@shared/models';
import { IS_AUTH_REQUEST } from '@core/http/api.config';
import { AuthService } from '@core/auth/auth.service';

let renovacaoEmAndamento: Observable<TokenResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const roteador = inject(Router);
  const autenticacao = inject(AuthService);

  const comToken = (original: HttpRequest<unknown>): HttpRequest<unknown> => {
    const token = autenticacao.tokenDeAcesso;
    return token ? original.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : original;
  };

  const ehRequisicaoDeAutenticacao = requisicao.context.get(IS_AUTH_REQUEST);

  return proximo(comToken(requisicao)).pipe(
    catchError((erro: unknown) => {
      if (
        !(erro instanceof HttpErrorResponse) ||
        erro.status !== 401 ||
        ehRequisicaoDeAutenticacao ||
        !autenticacao.tokenDeAcesso
      ) {
        return throwError(() => erro);
      }
      return renovarERepetir(autenticacao, proximo, requisicao, comToken, roteador);
    }),
  );
};

function renovarERepetir(
  autenticacao: AuthService,
  proximo: HttpHandlerFn,
  original: HttpRequest<unknown>,
  comToken: (requisicao: HttpRequest<unknown>) => HttpRequest<unknown>,
  roteador: Router,
): Observable<HttpEvent<unknown>> {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = autenticacao
      .renovarToken()
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }
  return renovacaoEmAndamento.pipe(
    switchMap(() => {
      renovacaoEmAndamento = null;
      return proximo(comToken(original));
    }),
    catchError((erro: unknown) => {
      renovacaoEmAndamento = null;
      autenticacao.sair();
      roteador.navigate(['/entrar']);
      return throwError(() => erro);
    }),
  );
}
