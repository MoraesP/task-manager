import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ALLOWED_TRANSITIONS, STATUS_LABEL, Task, TaskStatus } from '@shared/models';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-task-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, PriorityBadgeComponent, AvatarComponent, IconComponent],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  readonly tarefa = input.required<Task>();
  readonly menuAberto = input(false);
  readonly abrir = output<void>();
  readonly mover = output<TaskStatus>();
  readonly excluir = output<void>();
  readonly menuAlternado = output<boolean>();

  protected readonly idCurto = computed(
    () => 'T-' + this.tarefa().id.slice(0, 4).toUpperCase(),
  );
  protected readonly proximosEstados = computed<readonly TaskStatus[]>(
    () => ALLOWED_TRANSITIONS[this.tarefa().status],
  );

  protected rotulo(status: TaskStatus): string {
    return STATUS_LABEL[status];
  }

  protected ehReabertura(status: TaskStatus): boolean {
    return status === 'IN_PROGRESS' && this.tarefa().status === 'DONE';
  }

  protected alternarMenu(evento: Event): void {
    evento.stopPropagation();
    this.menuAlternado.emit(!this.menuAberto());
  }

  protected escolher(status: TaskStatus): void {
    this.menuAlternado.emit(false);
    this.mover.emit(status);
  }

  protected remover(): void {
    this.menuAlternado.emit(false);
    this.excluir.emit();
  }
}
