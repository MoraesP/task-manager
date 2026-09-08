import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-host">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="t.kind" (click)="toast.dismiss(t.id)">
          <span class="dot"></span>
          <span class="msg">{{ t.text }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-host {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: min(380px, calc(100vw - 40px));
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--r-sm);
      box-shadow: var(--shadow-md);
      padding: 11px 13px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
      animation: fadeUp .18s ease;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; background: var(--text-3); }
    .toast.success .dot { background: var(--green); }
    .toast.error .dot { background: var(--red); }
    .toast.error { border-color: #e7c7c4; }
    .msg { line-height: 1.4; }
  `,
})
export class ToastHost {
  protected readonly toast = inject(ToastService);
}
