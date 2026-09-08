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
  task: Task | null;
  members: ProjectMember[];
}

@Component({
  selector: 'app-task-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconComponent, SpinnerComponent, StatusPillComponent],
  templateUrl: './task-drawer.component.html',
  styleUrl: './task-drawer.component.scss',
})
export class TaskDrawerComponent {
  protected readonly ref = inject<DialogRef<Task | undefined>>(DialogRef);
  protected readonly data = inject<TaskDrawerData>(DIALOG_DATA);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly board = inject(BoardService);

  protected readonly editing = !!this.data.task;
  protected readonly loading = signal(false);
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly priorityLabel = PRIORITY_LABEL;
  protected readonly members = this.data.members;

  protected readonly form = this.fb.group({
    title: [this.data.task?.title ?? '', [Validators.required, Validators.maxLength(255)]],
    description: [this.data.task?.description ?? ''],
    priority: [this.data.task?.priority ?? 'MEDIUM'],
    deadline: [this.data.task?.deadline ? this.data.task.deadline.slice(0, 10) : ''],
    assigneeId: [this.data.task?.assigneeId ?? '', [Validators.required]],
  });

  protected readonly currentStatus = computed(() => this.data.task?.status ?? 'TODO');

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.loading.set(true);
    const v = this.form.getRawValue();
    const input: TaskInput = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      priority: v.priority,
      deadline: v.deadline ? new Date(v.deadline + 'T12:00:00').toISOString() : null,
      assigneeId: v.assigneeId,
    };
    const req = this.editing
      ? this.board.update(this.data.task!.id, input)
      : this.board.create(input);
    req.subscribe({
      next: (task) => this.ref.close(task),
      error: () => this.loading.set(false),
    });
  }
}
