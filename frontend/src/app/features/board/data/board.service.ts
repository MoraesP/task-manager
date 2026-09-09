import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { PageResponse, Task, TaskStatus, TASK_STATUSES } from '@shared/models';
import { API_BASE, SKIP_ERROR_TOAST } from '@core/http/api.config';
import { MembersService } from '@features/members/data/members.service';
import { ProjectMember } from '@shared/models';
import { TaskFilter } from '../models/task-filter.model';
import { TaskInput } from '../models/task-input.model';

const ignorarToast = () => new HttpContext().set(SKIP_ERROR_TOAST, true);
const TAMANHO_DA_PAGINA_DO_QUADRO = 100;

/**
 * Estado do quadro de um projeto. Fornecido pelo BoardPage, portanto recriado ao
 * trocar de projeto (docs/08-frontend.md).
 */
@Injectable()
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly servicoDeMembros = inject(MembersService);

  private projetoId = '';

  private readonly _tarefas = signal<Task[]>([]);
  private readonly _membros = signal<ProjectMember[]>([]);
  private readonly _carregando = signal(true);
  private readonly _total = signal(0);
  private readonly _filtro = signal<TaskFilter>({ sort: 'priority,desc' });

  readonly tarefas = this._tarefas.asReadonly();
  readonly membros = this._membros.asReadonly();
  readonly carregando = this._carregando.asReadonly();
  readonly total = this._total.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly truncado = computed(() => this._total() > this._tarefas().length);
  readonly statusDisponiveis = TASK_STATUSES;

  readonly colunas = computed<Record<TaskStatus, Task[]>>(() => {
    const agrupado = { TODO: [], IN_PROGRESS: [], DONE: [] } as Record<TaskStatus, Task[]>;
    for (const tarefa of this._tarefas()) {
      agrupado[tarefa.status].push(tarefa);
    }
    return agrupado;
  });

  iniciar(projetoId: string): void {
    this.projetoId = projetoId;
    this.servicoDeMembros.listar(projetoId).subscribe((membros) => this._membros.set(membros));
    this.recarregar();
  }

  definirFiltro(ajuste: Partial<TaskFilter>): void {
    this._filtro.update((filtro) => ({ ...filtro, ...ajuste }));
    this.recarregar();
  }

  recarregar(): void {
    this._carregando.set(true);
    let parametros = new HttpParams().set('page', 0).set('size', TAMANHO_DA_PAGINA_DO_QUADRO);
    const filtro = this._filtro();
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

    this.http
      .get<PageResponse<Task>>(`${API_BASE}/projects/${this.projetoId}/tasks`, { params: parametros })
      .subscribe({
        next: (resposta) => {
          this._tarefas.set(resposta.content);
          this._total.set(resposta.totalElements);
          this._carregando.set(false);
        },
        error: () => this._carregando.set(false),
      });
  }

  buscar(termo: string, pagina: number, tamanho: number): Observable<PageResponse<Task>> {
    const parametros = new HttpParams().set('q', termo).set('page', pagina).set('size', tamanho);
    return this.http.get<PageResponse<Task>>(
      `${API_BASE}/projects/${this.projetoId}/tasks/search`,
      { params: parametros },
    );
  }

  criar(dados: TaskInput): Observable<Task> {
    return this.http
      .post<Task>(`${API_BASE}/projects/${this.projetoId}/tasks`, dados)
      .pipe(tap((tarefa) => this._tarefas.update((lista) => [tarefa, ...lista])));
  }

  atualizar(tarefaId: string, dados: TaskInput): Observable<Task> {
    return this.http
      .put<Task>(`${API_BASE}/projects/${this.projetoId}/tasks/${tarefaId}`, dados)
      .pipe(tap((tarefa) => this.substituir(tarefa)));
  }

  mudarStatus(tarefaId: string, status: TaskStatus): Observable<Task> {
    return this.http
      .patch<Task>(
        `${API_BASE}/projects/${this.projetoId}/tasks/${tarefaId}/status`,
        { status },
        { context: ignorarToast() },
      )
      .pipe(tap((tarefa) => this.substituir(tarefa)));
  }

  excluir(tarefaId: string): Observable<void> {
    return this.http
      .delete<void>(`${API_BASE}/projects/${this.projetoId}/tasks/${tarefaId}`)
      .pipe(
        tap(() =>
          this._tarefas.update((lista) => lista.filter((tarefa) => tarefa.id !== tarefaId)),
        ),
      );
  }

  /** Move otimista de um card entre colunas (revertido pelo componente em caso de erro). */
  moverOtimista(tarefaId: string, destino: TaskStatus): void {
    this._tarefas.update((lista) =>
      lista.map((tarefa) => (tarefa.id === tarefaId ? { ...tarefa, status: destino } : tarefa)),
    );
  }

  private substituir(tarefaAtualizada: Task): void {
    this._tarefas.update((lista) =>
      lista.map((tarefa) => (tarefa.id === tarefaAtualizada.id ? tarefaAtualizada : tarefa)),
    );
  }
}
