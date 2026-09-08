import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STATUS_LABEL, TaskStatus } from '@shared/models';

@Component({
  selector: 'app-status-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-pill.component.html',
  styleUrl: './status-pill.component.scss',
})
export class StatusPillComponent {
  readonly value = input.required<TaskStatus>();
  protected readonly label = computed(() => STATUS_LABEL[this.value()]);
  protected readonly modifier = computed(() => this.value().toLowerCase().replace('_', '-'));
}
