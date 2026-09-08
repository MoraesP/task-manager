import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from './icon';

@Component({
  selector: 'app-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (totalPages() > 1 || total() > 0) {
      <div class="pager">
        <button class="pg" [disabled]="page() === 0" (click)="go.emit(page() - 1)" aria-label="Anterior">
          <app-icon name="chevron-left" [size]="14" [stroke]="2.4" />
        </button>
        <span class="range">{{ from() }}–{{ to() }} de {{ total() }}</span>
        <button
          class="pg"
          [disabled]="page() >= totalPages() - 1"
          (click)="go.emit(page() + 1)"
          aria-label="Próxima"
        >
          <app-icon name="chevron-right" [size]="14" [stroke]="2.4" />
        </button>
      </div>
    }
  `,
  styles: `
    .pager { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 18px 0 4px; color: var(--text-2); font-size: 12.5px; }
    .pg { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-2); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .pg:hover:not(:disabled) { background: var(--surface-2); }
    .pg:disabled { opacity: .4; cursor: default; }
  `,
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
