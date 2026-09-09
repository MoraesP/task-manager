import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STATUS_LABEL, TaskStatus } from '@shared/models';

@Component({
  selector: 'app-status-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-pill.component.html',
  styleUrl: './status-pill.component.scss',
})
export class StatusPillComponent {
  readonly valor = input.required<TaskStatus>();
  protected readonly rotulo = computed(() => STATUS_LABEL[this.valor()]);
  protected readonly modificador = computed(() => this.valor().toLowerCase().replace('_', '-'));
}
