import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PRIORITY_LABEL, ProjectMember, Task, TASK_PRIORITIES } from '@shared/models';
import { StatusPillComponent } from '@shared/components/status-pill/status-pill.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { BoardService } from '../../data/board.service';
import { TaskInput } from '../../models/task-input.model';

export interface TaskDrawerData {
  tarefa: Task | null;
  membros: ProjectMember[];
}

@Component({
  selector: 'app-task-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconComponent, SpinnerComponent, StatusPillComponent],
  templateUrl: './task-drawer.component.html',
  styleUrl: './task-drawer.component.scss',
})
export class TaskDrawerComponent {
  private readonly quadro = inject(BoardService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly dados = inject<TaskDrawerData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<Task | undefined>>(DialogRef);

  protected readonly editando = !!this.dados.tarefa;

  protected readonly carregando = signal(false);

  protected readonly prioridades = TASK_PRIORITIES;
  protected readonly rotuloDePrioridade = PRIORITY_LABEL;

  protected readonly membros = this.dados.membros;

  protected readonly form = this.formBuilder.group({
    title: [this.dados.tarefa?.title ?? '', [Validators.required, Validators.maxLength(255)]],
    description: [this.dados.tarefa?.description ?? ''],
    priority: [this.dados.tarefa?.priority ?? 'MEDIUM'],
    deadline: [this.dados.tarefa?.deadline ? this.dados.tarefa.deadline.slice(0, 10) : ''],
    assigneeId: [this.dados.tarefa?.assigneeId ?? '', [Validators.required]],
  });

  protected readonly statusAtual = computed(() => this.dados.tarefa?.status ?? 'TODO');

  protected enviar(): void {
    if (this.form.invalid || this.carregando()) {
      return;
    }
    this.carregando.set(true);
    const valores = this.form.getRawValue();
    const entrada: TaskInput = {
      title: valores.title.trim(),
      description: valores.description.trim() || null,
      priority: valores.priority,
      deadline: valores.deadline ? new Date(valores.deadline + 'T12:00:00').toISOString() : null,
      assigneeId: valores.assigneeId,
    };
    const requisicao = this.editando
      ? this.quadro.atualizar(this.dados.tarefa!.id, entrada)
      : this.quadro.criar(entrada);
    requisicao.subscribe({
      next: (tarefa) => this.ref.close(tarefa),
      error: () => this.carregando.set(false),
    });
  }
}
