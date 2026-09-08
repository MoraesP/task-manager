import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { LayoutService } from '../core/layout.service';
import { IconComponent } from '../shared/icon';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <header class="topbar">
      <button class="burger" (click)="layout.toggleSidebar()" aria-label="Menu">
        <app-icon name="list" [size]="18" [stroke]="1.8" />
      </button>
      <h1>{{ title() }}</h1>
      @if (crumb()) {
        <span class="dot">·</span>
        <span class="crumb">{{ crumb() }}</span>
      }
      <ng-content select="[badge]" />
      <div class="spacer"></div>
      <ng-content />
    </header>
  `,
  styles: `
    .topbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      flex-shrink: 0;
    }
    h1 { font-size: 16px; font-weight: 700; white-space: nowrap; }
    .dot, .crumb { color: var(--text-3); font-weight: 500; }
    .burger { display: none; background: none; border: 1px solid var(--border); border-radius: 6px; width: 32px; height: 32px; align-items: center; justify-content: center; color: var(--text-2); cursor: pointer; }
    @media (max-width: 860px) { .burger { display: inline-flex; } .crumb, .dot { display: none; } }
  `,
})
export class TopbarComponent {
  protected readonly layout = inject(LayoutService);
  readonly title = input.required<string>();
  readonly crumb = input<string>();
}
