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
  readonly task = input.required<Task>();
  readonly menuOpen = input(false);
  readonly open = output<void>();
  readonly move = output<TaskStatus>();
  readonly delete = output<void>();
  readonly menuToggled = output<boolean>();

  protected readonly shortId = computed(() => 'T-' + this.task().id.slice(0, 4).toUpperCase());
  protected readonly nextStates = computed<readonly TaskStatus[]>(
    () => ALLOWED_TRANSITIONS[this.task().status],
  );

  protected label(s: TaskStatus): string {
    return STATUS_LABEL[s];
  }

  protected isReopen(s: TaskStatus): boolean {
    return s === 'IN_PROGRESS' && this.task().status === 'DONE';
  }

  protected toggleMenu(ev: Event): void {
    ev.stopPropagation();
    this.menuToggled.emit(!this.menuOpen());
  }

  protected pick(s: TaskStatus): void {
    this.menuToggled.emit(false);
    this.move.emit(s);
  }

  protected del(): void {
    this.menuToggled.emit(false);
    this.delete.emit();
  }
}
