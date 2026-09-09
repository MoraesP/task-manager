import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ROLE_LABEL, Role } from '@shared/models';

@Component({
  selector: 'app-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-badge.component.html',
  styleUrl: './role-badge.component.scss',
})
export class RoleBadgeComponent {
  readonly valor = input.required<Role>();
  protected readonly rotulo = computed(() => ROLE_LABEL[this.valor()]);
}
