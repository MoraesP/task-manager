import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PageResponse, STATUS_LABEL, Task, TaskStatus, canTransition } from '@shared/models';
import { AuthService } from '@core/auth/auth.service';
import { mensagemDeErro } from '@core/http/problem-detail';
import { ToastService } from '@core/notifications/toast.service';
import { ProjectsService } from '@features/projects/data/projects.service';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageLoaderComponent } from '@shared/components/page-loader/page-loader.component';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { TopbarComponent } from '@shared/components/topbar/topbar.component';
import { BoardService } from '../../data/board.service';
import { BoardToolbarComponent } from '../../ui/board-toolbar/board-toolbar.component';
import { TaskCardComponent } from '../../ui/task-card/task-card.component';
import { TaskDrawerComponent, TaskDrawerData } from '../../ui/task-drawer/task-drawer.component';
import { TaskFilter } from '../../models/task-filter.model';

@Component({
  selector: 'app-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'idDoMenuAberto.set(null)' },
  providers: [BoardService],
  imports: [
    CdkDropList,
    CdkDrag,
    TopbarComponent,
    BoardToolbarComponent,
    TaskCardComponent,
    PaginatorComponent,
    EmptyStateComponent,
    PageLoaderComponent,
    RoleBadgeComponent,
  ],
  templateUrl: './board.page.html',
  styleUrl: './board.page.scss',
})
export class BoardPage {
  private readonly dialog = inject(Dialog);
  protected readonly quadro = inject(BoardService);
  private readonly autenticacao = inject(AuthService);
  private readonly notificacoes = inject(ToastService);
  private readonly servicoDeProjetos = inject(ProjectsService);

  protected readonly projeto = this.servicoDeProjetos.projetoAtual;

  protected readonly rotuloDeStatus = STATUS_LABEL;

  protected readonly idsDasColunas = ['col-TODO', 'col-IN_PROGRESS', 'col-DONE'];

  protected readonly idDoMenuAberto = signal<string | null>(null);

  protected readonly termoDeBusca = signal('');
  protected readonly buscando = signal(false);
  protected readonly paginaDaBusca = signal(0);
  protected readonly resultadoDaBusca = signal<PageResponse<Task> | null>(null);
  protected readonly mostrarQuadro = computed(() => this.termoDeBusca().length === 0);

  protected readonly tarefaArrastada = signal<Task | null>(null);
  protected readonly arrastando = computed(() => this.tarefaArrastada() !== null);

  constructor() {
    const idDoProjeto = this.projeto()?.id;
    if (idDoProjeto) {
      this.quadro.iniciar(idDoProjeto);
    }
  }

  protected aoMudarFiltro(ajuste: Partial<TaskFilter>): void {
    this.quadro.definirFiltro(ajuste);
  }

  protected aoBuscar(termo: string): void {
    this.termoDeBusca.set(termo);
    if (termo.length >= 2) {
      this.executarBusca(0);
    } else {
      this.resultadoDaBusca.set(null);
    }
  }

  protected executarBusca(pagina: number): void {
    this.buscando.set(true);
    this.paginaDaBusca.set(pagina);
    this.quadro.buscar(this.termoDeBusca(), pagina, 20).subscribe({
      next: (resposta) => {
        this.resultadoDaBusca.set(resposta);
        this.buscando.set(false);
      },
      error: () => this.buscando.set(false),
    });
  }

  protected aoSoltarCard(evento: CdkDragDrop<Task[]>, destino: TaskStatus): void {
    if (evento.previousContainer === evento.container) {
      return;
    }
    this.aplicarMudancaDeStatus(evento.item.data as Task, destino);
  }

  protected moverPeloMenu(tarefa: Task, destino: TaskStatus): void {
    this.aplicarMudancaDeStatus(tarefa, destino);
  }

  private aplicarMudancaDeStatus(tarefa: Task, destino: TaskStatus): void {
    if (tarefa.status === destino) {
      return;
    }
    if (!canTransition(tarefa.status, destino)) {
      this.notificacoes.erro(
        `Transição inválida: “${STATUS_LABEL[tarefa.status]}” não vai direto para “${STATUS_LABEL[destino]}”.`,
      );
      return;
    }
    const origem = tarefa.status;
    this.quadro.moverOtimista(tarefa.id, destino);
    this.quadro.mudarStatus(tarefa.id, destino).subscribe({
      error: (erro) => {
        this.quadro.moverOtimista(tarefa.id, origem);
        this.notificacoes.erro(mensagemDeErro(erro));
      },
    });
  }

  protected excluirTarefa(tarefa: Task): void {
    this.quadro.excluir(tarefa.id).subscribe({
      next: () => this.notificacoes.sucesso('Tarefa excluída.'),
    });
  }

  protected novaTarefa(): void {
    this.abrirGaveta(null);
  }

  protected editarTarefa(tarefa: Task): void {
    this.abrirGaveta(tarefa);
  }

  private abrirGaveta(tarefa: Task | null): void {
    const dados: TaskDrawerData = { tarefa, membros: this.quadro.membros() };
    const eraMinha = tarefa?.assigneeId === this.autenticacao.usuario()?.id;
    this.dialog
      .open<Task | undefined>(TaskDrawerComponent, {
        data: dados,
        panelClass: 'drawer-pane',
        hasBackdrop: true,
        providers: [{ provide: BoardService, useValue: this.quadro }],
      })
      .closed.subscribe((tarefaSalva) => {
        if (
          tarefaSalva &&
          !eraMinha &&
          tarefaSalva.assigneeId === this.autenticacao.usuario()?.id
        ) {
          this.notificacoes.sucesso(`Tarefa atribuída a você: “${tarefaSalva.title}”.`);
        }
      });
  }

  protected aoIniciarArraste(tarefa: Task): void {
    this.tarefaArrastada.set(tarefa);
  }

  protected aoFinalizarArraste(): void {
    this.tarefaArrastada.set(null);
  }
}
