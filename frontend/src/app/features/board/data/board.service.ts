import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { PageResponse, ProjectMember, Task, TaskStatus, TASK_STATUSES } from '@shared/models';
import { MembersService } from '@features/members/data/members.service';
import { TaskFilter } from '../models/task-filter.model';
import { TaskInput } from '../models/task-input.model';
import { TasksApiService } from './tasks-api.service';

const TAMANHO_DA_PAGINA_DO_QUADRO = 100;

/**
 * Estado do quadro de um projeto. Fornecido pelo BoardPage, portanto recriado ao
 * trocar de projeto (docs/08-frontend.md). As chamadas HTTP ficam no
 * TasksApiService; aqui só vive o estado em signals e a orquestração.
 */
@Injectable()
export class BoardService {
  private readonly api = inject(TasksApiService);
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
    this.api.listar(this.projetoId, this._filtro(), 0, TAMANHO_DA_PAGINA_DO_QUADRO).subscribe({
      next: (resposta) => {
        this._tarefas.set(resposta.content);
        this._total.set(resposta.totalElements);
        this._carregando.set(false);
      },
      error: () => this._carregando.set(false),
    });
  }

  buscar(termo: string, pagina: number, tamanho: number): Observable<PageResponse<Task>> {
    return this.api.buscar(this.projetoId, termo, pagina, tamanho);
  }

  criar(dados: TaskInput): Observable<Task> {
    return this.api
      .criar(this.projetoId, dados)
      .pipe(tap((tarefa) => this._tarefas.update((lista) => [tarefa, ...lista])));
  }

  atualizar(tarefaId: string, dados: TaskInput): Observable<Task> {
    return this.api
      .atualizar(this.projetoId, tarefaId, dados)
      .pipe(tap((tarefa) => this.substituir(tarefa)));
  }

  mudarStatus(tarefaId: string, status: TaskStatus): Observable<Task> {
    return this.api
      .mudarStatus(this.projetoId, tarefaId, status)
      .pipe(tap((tarefa) => this.substituir(tarefa)));
  }

  excluir(tarefaId: string): Observable<void> {
    return this.api
      .excluir(this.projetoId, tarefaId)
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
