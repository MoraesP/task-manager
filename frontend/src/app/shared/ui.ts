import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="sp" [style.width.px]="size()" [style.height.px]="size()"></span>`,
  styles: `
    .sp {
      display: inline-block;
      border: 2px solid var(--border-strong);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
})
export class SpinnerComponent {
  readonly size = input(18);
}

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      text-align: center;
      padding: 44px 24px;
      border: 1px dashed var(--border-strong);
      border-radius: var(--r);
      color: var(--text-2);
      background: var(--raise);
    }
    h3 { font-size: 15px; font-weight: 700; color: var(--text); }
    p { font-size: 13px; margin-top: 4px; }
    .empty ::ng-deep .btn { margin-top: 14px; }
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input('');
}

@Component({
  selector: 'app-page-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpinnerComponent],
  template: `<div class="pl"><app-spinner [size]="22" /></div>`,
  styles: `.pl { display: flex; justify-content: center; padding: 60px; }`,
})
export class PageLoaderComponent {}
