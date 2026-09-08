import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PRIORITY_LABEL, ROLE_LABEL, Role, STATUS_LABEL, TaskPriority, TaskStatus } from '../core/models';

@Component({
  selector: 'app-priority-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="prio" [class]="value().toLowerCase()">{{ label() }}</span>`,
  styles: `
    .prio {
      display: inline-flex;
      align-items: center;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 5px;
    }
    .low { background: var(--surface-2); color: var(--text-3); }
    .medium { background: var(--accent-soft); color: var(--accent); }
    .high { background: var(--amber-soft); color: var(--amber); }
    .critical { background: var(--red-soft); color: var(--red); }
  `,
})
export class PriorityBadgeComponent {
  readonly value = input.required<TaskPriority>();
  protected readonly label = computed(() => PRIORITY_LABEL[this.value()]);
}

@Component({
  selector: 'app-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class.admin]="value() === 'ADMIN'" [class.member]="value() === 'MEMBER'">{{
    label()
  }}</span>`,
})
export class RoleBadgeComponent {
  readonly value = input.required<Role>();
  protected readonly label = computed(() => ROLE_LABEL[this.value()]);
}

@Component({
  selector: 'app-status-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="pill" [class.doing]="value() === 'IN_PROGRESS'" [class.done]="value() === 'DONE'">{{
    label()
  }}</span>`,
  styles: `
    .pill {
      display: inline-flex;
      align-items: center;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: .03em;
      text-transform: uppercase;
      padding: 1px 6px;
      border-radius: 5px;
      background: var(--surface-2);
      color: var(--text-3);
    }
    .doing { background: var(--accent-soft); color: var(--accent); }
    .done { background: var(--green-soft); color: var(--green); }
  `,
})
export class StatusPillComponent {
  readonly value = input.required<TaskStatus>();
  protected readonly label = computed(() => STATUS_LABEL[this.value()]);
}
