import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SKIP_ERROR_TOAST } from '@core/http/api.config';
import { errorMessage } from '@core/http/problem-detail';
import { ToastService } from '@core/notifications/toast.service';

/**
 * Normaliza erros da API em um único ponto: mostra um toast com o `detail` do
 * ProblemDetail. Requisições marcadas com SKIP_ERROR_TOAST tratam o erro sozinhas
 * (ex.: reverter card no quadro). 401 é responsabilidade do authInterceptor.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: unknown) => {
      const skip = req.context.get(SKIP_ERROR_TOAST);
      const status = err instanceof HttpErrorResponse ? err.status : 0;
      if (!skip && status !== 401) {
        toast.error(errorMessage(err));
      }
      return throwError(() => err);
    }),
  );
};
