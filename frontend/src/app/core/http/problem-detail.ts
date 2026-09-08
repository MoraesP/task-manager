import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '@shared/models';

export function asProblemDetail(err: unknown): ProblemDetail | null {
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object') {
    const body = err.error as ProblemDetail;
    if (typeof body.status === 'number') {
      return body;
    }
  }
  return null;
}

/** Mensagem legível para o usuário, priorizando o `detail` do ProblemDetail. */
export function errorMessage(err: unknown, fallback = 'Não foi possível concluir a ação.'): string {
  const pd = asProblemDetail(err);
  if (pd) {
    if (pd.errors?.length) {
      return pd.errors.map((e) => e.message).join(' · ');
    }
    return pd.detail || pd.title || fallback;
  }
  if (err instanceof HttpErrorResponse && err.status === 0) {
    return 'Sem conexão com o servidor.';
  }
  return fallback;
}
