import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE, SKIP_ERROR_TOAST } from '@core/http/api.config';
import { PageResponse, Task, TaskStatus } from '@shared/models';
import { TaskFilter } from '../models/task-filter.model';
import { TaskInput } from '../models/task-input.model';

const ignorarToast = () => new HttpContext().set(SKIP_ERROR_TOAST, true);

/**
 * Acesso HTTP aos endpoints de tarefa de um projeto (`/projects/{id}/tasks`).
 * Stateless: o estado do quadro (signals) vive no BoardService, que delega as
 * chamadas para cá. Também é usado pela tela de membros, que só precisa ler.
 */
@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private readonly http = inject(HttpClient);

  listar(
    projetoId: string,
    filtro: TaskFilter = {},
    pagina = 0,
    tamanho = 20,
  ): Observable<PageResponse<Task>> {
    let parametros = new HttpParams().set('page', pagina).set('size', tamanho);
    if (filtro.status) {
      parametros = parametros.set('status', filtro.status);
    }
    if (filtro.priority) {
      parametros = parametros.set('priority', filtro.priority);
    }
    if (filtro.assigneeId) {
      parametros = parametros.set('assigneeId', filtro.assigneeId);
    }
    if (filtro.deadlineFrom) {
      parametros = parametros.set('deadlineFrom', filtro.deadlineFrom);
    }
    if (filtro.deadlineTo) {
      parametros = parametros.set('deadlineTo', filtro.deadlineTo);
    }
    if (filtro.sort) {
      parametros = parametros.set('sort', filtro.sort);
    }
    return this.http.get<PageResponse<Task>>(`${API_BASE}/projects/${projetoId}/tasks`, {
      params: parametros,
    });
  }

  buscar(
    projetoId: string,
    termo: string,
    pagina: number,
    tamanho: number,
  ): Observable<PageResponse<Task>> {
    const parametros = new HttpParams().set('q', termo).set('page', pagina).set('size', tamanho);
    return this.http.get<PageResponse<Task>>(`${API_BASE}/projects/${projetoId}/tasks/search`, {
      params: parametros,
    });
  }

  criar(projetoId: string, dados: TaskInput): Observable<Task> {
    return this.http.post<Task>(`${API_BASE}/projects/${projetoId}/tasks`, dados);
  }

  atualizar(projetoId: string, tarefaId: string, dados: TaskInput): Observable<Task> {
    return this.http.put<Task>(`${API_BASE}/projects/${projetoId}/tasks/${tarefaId}`, dados);
  }

  /**
   * Erros são propagados sem toast automático — quem chama (o quadro) faz o
   * move otimista e reverte o card exibindo o `detail` do ProblemDetail.
   */
  mudarStatus(projetoId: string, tarefaId: string, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(
      `${API_BASE}/projects/${projetoId}/tasks/${tarefaId}/status`,
      { status },
      { context: ignorarToast() },
    );
  }

  excluir(projetoId: string, tarefaId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/projects/${projetoId}/tasks/${tarefaId}`);
  }
}
