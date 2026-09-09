import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  PRIORITY_LABEL,
  ProjectMember,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '@shared/models';
import { IconComponent } from '@shared/components/icon/icon.component';
import { TaskFilter } from '../../models/task-filter.model';

@Component({
  selector: 'app-board-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './board-toolbar.component.html',
  styleUrl: './board-toolbar.component.scss',
})
export class BoardToolbarComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly membros = input<ProjectMember[]>([]);
  readonly novaTarefa = output<void>();
  readonly filtroMudou = output<Partial<TaskFilter>>();
  readonly buscaMudou = output<string>();

  protected readonly statusDisponiveis = TASK_STATUSES;
  protected readonly prioridades = TASK_PRIORITIES;
  protected readonly rotuloDeStatus = STATUS_LABEL;
  protected readonly rotuloDePrioridade = PRIORITY_LABEL;

  protected readonly campoDeBusca = new FormControl('', { nonNullable: true });

  protected readonly filtros = this.formBuilder.group({
    status: [''],
    priority: [''],
    assigneeId: [''],
    deadlineFrom: [''],
    deadlineTo: [''],
    sort: ['priority,desc'],
  });

  private readonly valorDeBusca = toSignal(
    this.campoDeBusca.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  constructor() {
    effect(() => this.buscaMudou.emit(this.valorDeBusca().trim()));
  }

  protected aplicar(): void {
    const valores = this.filtros.getRawValue();
    this.filtroMudou.emit({
      status: (valores.status || null) as TaskFilter['status'],
      priority: (valores.priority || null) as TaskFilter['priority'],
      assigneeId: valores.assigneeId || null,
      deadlineFrom: valores.deadlineFrom
        ? new Date(valores.deadlineFrom + 'T00:00:00').toISOString()
        : null,
      deadlineTo: valores.deadlineTo
        ? new Date(valores.deadlineTo + 'T23:59:59').toISOString()
        : null,
      sort: valores.sort,
    });
  }
}
