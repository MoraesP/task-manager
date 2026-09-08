import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../core/layout.service';
import { SidebarComponent } from './sidebar';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="layout" [class.nav-open]="layout.sidebarOpen()">
      <div class="scrim" (click)="layout.closeSidebar()"></div>
      <app-sidebar class="nav" />
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .layout { display: flex; height: 100vh; overflow: hidden; }
    .main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
    .scrim { display: none; }

    @media (max-width: 860px) {
      .nav {
        position: fixed;
        inset: 0 auto 0 0;
        z-index: 60;
        transform: translateX(-100%);
        transition: transform .22s ease;
        box-shadow: var(--shadow-lg);
      }
      .nav-open .nav { transform: none; }
      .nav-open .scrim {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgba(33, 31, 27, .34);
      }
    }
  `,
})
export class ShellComponent {
  protected readonly layout = inject(LayoutService);
}
