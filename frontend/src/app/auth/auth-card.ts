import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../shared/icon';

@Component({
  selector: 'app-auth-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="wrap">
      <div class="card">
        <div class="brand">
          <app-icon name="board" [size]="20" [stroke]="1.7" />
          <span>Task Manager</span>
        </div>
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      background: radial-gradient(120% 80% at 50% -10%, #ffffff 0%, var(--bg) 62%);
    }
    .card {
      width: 392px;
      max-width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: var(--shadow-md);
      padding: 30px;
      animation: fadeUp .2s ease;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 9px;
      font-weight: 700;
      font-size: 15px;
      color: var(--text);
      padding-bottom: 20px;
    }
    .brand app-icon { color: var(--accent); }
  `,
})
export class AuthCardComponent {}
