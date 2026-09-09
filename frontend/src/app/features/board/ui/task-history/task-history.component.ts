import { DatePipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  Task,
  TASK_CHANGE_LABEL,
  TaskChangeType,
  TaskHistory,
  TaskPriority,
  TaskStatus,
} from '@shared/models';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { TasksApiService } from '../../data/tasks-api.service';

interface ItemDeAlteracao {
  rotulo: string;
  de: string;
  para: string;
}

interface GrupoDeHistorico {
  occurredAt: string;
  autor: string;
  itens: ItemDeAlteracao[];
}

@Component({
  selector: 'app-task-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, SpinnerComponent, EmptyStateComponent],
  templateUrl: './task-history.component.html',
  styleUrl: './task-history.component.scss',
})
export class TaskHistoryComponent implements OnInit {
  private readonly api = inject(TasksApiService);

  readonly tarefa = input.required<Task>();

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly historico = signal<TaskHistory | null>(null);

  protected readonly grupos = computed<GrupoDeHistorico[]>(() => {
    const dados = this.historico();
    if (!dados) {
      return [];
    }
    const porInstante = new Map<string, GrupoDeHistorico>();
    for (const alteracao of dados.changes) {
      let grupo = porInstante.get(alteracao.occurredAt);
      if (!grupo) {
        grupo = { occurredAt: alteracao.occurredAt, autor: alteracao.author.name, itens: [] };
        porInstante.set(alteracao.occurredAt, grupo);
      }
      grupo.itens.push({
        rotulo: TASK_CHANGE_LABEL[alteracao.type],
        de: this.formatar(alteracao.type, alteracao.oldValue),
        para: this.formatar(alteracao.type, alteracao.newValue),
      });
    }
    return [...porInstante.values()];
  });

  ngOnInit(): void {
    const tarefa = this.tarefa();
    this.api.historico(tarefa.projectId, tarefa.id).subscribe({
      next: (dados) => {
        this.historico.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  private formatar(tipo: TaskChangeType, valor: string | null): string {
    if (valor === null || valor === '') {
      return '—';
    }
    switch (tipo) {
      case 'ALTERACAO_STATUS':
        return STATUS_LABEL[valor as TaskStatus] ?? valor;
      case 'ALTERACAO_PRIORIDADE':
        return PRIORITY_LABEL[valor as TaskPriority] ?? valor;
      case 'ALTERACAO_PRAZO':
        return formatDate(valor, 'dd/MM/yyyy', 'pt-BR');
      default:
        return valor; // título e descrição (texto); responsável já vem como nome
    }
  }
}
