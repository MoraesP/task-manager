import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SKIP_ERROR_TOAST } from '@core/http/api.config';
import { mensagemDeErro } from '@core/http/problem-detail';
import { ToastService } from '@core/notifications/toast.service';

/**
 * Normaliza erros da API em um único ponto: mostra um toast com o `detail` do
 * ProblemDetail. Requisições marcadas com SKIP_ERROR_TOAST tratam o erro sozinhas
 * (ex.: reverter card no quadro). 401 é responsabilidade do authInterceptor.
 */
export const errorInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  const notificacoes = inject(ToastService);
  return proximo(requisicao).pipe(
    catchError((erro: unknown) => {
      const ignorarToast = requisicao.context.get(SKIP_ERROR_TOAST);
      const status = erro instanceof HttpErrorResponse ? erro.status : 0;
      if (!ignorarToast && status !== 401) {
        notificacoes.erro(mensagemDeErro(erro));
      }
      return throwError(() => erro);
    }),
  );
};
