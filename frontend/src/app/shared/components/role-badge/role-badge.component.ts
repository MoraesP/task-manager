import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ROLE_LABEL, Role } from '@shared/models';

@Component({
  selector: 'app-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-badge.component.html',
  styleUrl: './role-badge.component.scss',
})
export class RoleBadgeComponent {
  readonly value = input.required<Role>();
  protected readonly label = computed(() => ROLE_LABEL[this.value()]);
}
