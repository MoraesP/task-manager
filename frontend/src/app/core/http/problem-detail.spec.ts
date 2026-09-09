import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDeErro } from './problem-detail';

/**
 * Ponto único de normalização de erro da API: o `errorInterceptor` e o quadro
 * usam isto para o toast. Precisa priorizar o `detail` do ProblemDetail (RFC 7807)
 * e ter fallbacks previsíveis.
 */
describe('mensagemDeErro', () => {
  const problema = (corpo: Record<string, unknown>, status = corpo['status'] as number) =>
    new HttpErrorResponse({ error: corpo, status });

  it('usa o `detail` do ProblemDetail (ex.: 409 de WIP limit)', () => {
    const erro = problema({
      status: 409,
      title: 'WIP limit exceeded',
      detail: 'O responsável já tem 5 tarefas IN_PROGRESS (limite: 5).',
    });
    expect(mensagemDeErro(erro)).toBe('O responsável já tem 5 tarefas IN_PROGRESS (limite: 5).');
  });

  it('junta as mensagens de `errors[]` quando é falha de validação (400)', () => {
    const erro = problema({
      status: 400,
      title: 'Falha de validação',
      errors: [
        { field: 'title', message: 'não pode ser vazio' },
        { field: 'assigneeId', message: 'é obrigatório' },
      ],
    });
    expect(mensagemDeErro(erro)).toBe('não pode ser vazio · é obrigatório');
  });

  it('cai para o `title` quando não há `detail` nem `errors`', () => {
    expect(mensagemDeErro(problema({ status: 403, title: 'Acesso negado' }))).toBe('Acesso negado');
  });

  it('reconhece falha de rede (status 0)', () => {
    expect(mensagemDeErro(new HttpErrorResponse({ status: 0 }))).toBe(
      'Sem conexão com o servidor.',
    );
  });

  it('usa o fallback para um erro que não é da API', () => {
    expect(mensagemDeErro(new Error('boom'))).toBe('Não foi possível concluir a ação.');
    expect(mensagemDeErro(null, 'Projeto indisponível.')).toBe('Projeto indisponível.');
  });
});
