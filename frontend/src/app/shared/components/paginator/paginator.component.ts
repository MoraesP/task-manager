import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss',
})
export class PaginatorComponent {
  readonly page = input(0);
  readonly size = input(20);
  readonly total = input(0);
  readonly totalPages = input(1);
  readonly go = output<number>();

  protected readonly from = computed(() => (this.total() === 0 ? 0 : this.page() * this.size() + 1));
  protected readonly to = computed(() => Math.min(this.total(), (this.page() + 1) * this.size()));
}
