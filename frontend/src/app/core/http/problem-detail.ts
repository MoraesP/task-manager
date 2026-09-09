import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '@shared/models';

export function comoProblemDetail(erro: unknown): ProblemDetail | null {
  if (erro instanceof HttpErrorResponse && erro.error && typeof erro.error === 'object') {
    const corpo = erro.error as ProblemDetail;
    if (typeof corpo.status === 'number') {
      return corpo;
    }
  }
  return null;
}

/** Mensagem legível para o usuário, priorizando o `detail` do ProblemDetail. */
export function mensagemDeErro(
  erro: unknown,
  alternativa = 'Não foi possível concluir a ação.',
): string {
  const problema = comoProblemDetail(erro);
  if (problema) {
    if (problema.errors?.length) {
      return problema.errors.map((violacao) => violacao.message).join(' · ');
    }
    return problema.detail || problema.title || alternativa;
  }
  if (erro instanceof HttpErrorResponse && erro.status === 0) {
    return 'Sem conexão com o servidor.';
  }
  return alternativa;
}
