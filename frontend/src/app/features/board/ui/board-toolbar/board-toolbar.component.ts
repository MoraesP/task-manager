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
  private readonly fb = inject(NonNullableFormBuilder);

  readonly members = input<ProjectMember[]>([]);
  readonly newTask = output<void>();
  readonly filterChange = output<Partial<TaskFilter>>();
  readonly searchChange = output<string>();

  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly priorityLabel = PRIORITY_LABEL;

  protected readonly search = new FormControl('', { nonNullable: true });

  protected readonly filters = this.fb.group({
    status: [''],
    priority: [''],
    assigneeId: [''],
    deadlineFrom: [''],
    deadlineTo: [''],
    sort: ['priority,desc'],
  });

  private readonly searchValue = toSignal(
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  constructor() {
    effect(() => this.searchChange.emit(this.searchValue().trim()));
  }

  protected apply(): void {
    const v = this.filters.getRawValue();
    this.filterChange.emit({
      status: (v.status || null) as TaskFilter['status'],
      priority: (v.priority || null) as TaskFilter['priority'],
      assigneeId: v.assigneeId || null,
      deadlineFrom: v.deadlineFrom ? new Date(v.deadlineFrom + 'T00:00:00').toISOString() : null,
      deadlineTo: v.deadlineTo ? new Date(v.deadlineTo + 'T23:59:59').toISOString() : null,
      sort: v.sort,
    });
  }
}
