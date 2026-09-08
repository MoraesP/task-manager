import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PRIORITY_LABEL, TaskPriority } from '@shared/models';

@Component({
  selector: 'app-priority-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './priority-badge.component.html',
  styleUrl: './priority-badge.component.scss',
})
export class PriorityBadgeComponent {
  readonly value = input.required<TaskPriority>();
  protected readonly label = computed(() => PRIORITY_LABEL[this.value()]);
}
