import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { LayoutService } from '../core/layout.service';
import { ProjectsService } from '../projects/projects.service';
import { AvatarComponent } from '../shared/avatar';
import { IconComponent } from '../shared/icon';
import { RoleBadgeComponent } from '../shared/badges';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, AvatarComponent, RoleBadgeComponent],
  template: `
    <aside class="sb" [class.dimproj]="section() === 'projetos'">
      <div class="brand">
        <app-icon name="board" [size]="20" [stroke]="1.7" />
        <span>Task Manager</span>
      </div>

      <nav class="grp">
        <a class="item" routerLink="/projetos" [class.active]="section() === 'projetos'" (click)="close()">
          <app-icon name="folder" [size]="18" [stroke]="1.6" /> Projetos
        </a>
      </nav>

      @if (project(); as p) {
        <div class="sb-proj">
          <div class="grp-label">Projeto</div>
          <button class="switch" (click)="goProjects()">
            <span class="pname">{{ p.name }}</span>
            <app-role-badge [value]="p.role" />
            <app-icon name="chevron-down" [size]="14" [stroke]="2" />
          </button>
          <nav class="grp">
            <a class="item" [routerLink]="['/projetos', p.id, 'quadro']" [class.active]="section() === 'quadro'" (click)="close()">
              <app-icon name="board" [size]="18" [stroke]="1.6" /> Quadro
            </a>
            <a class="item" [routerLink]="['/projetos', p.id, 'relatorio']" [class.active]="section() === 'relatorio'" (click)="close()">
              <app-icon name="chart" [size]="18" [stroke]="1.6" /> Relatório
            </a>
            <a class="item" [routerLink]="['/projetos', p.id, 'membros']" [class.active]="section() === 'membros'" (click)="close()">
              <app-icon name="users" [size]="18" [stroke]="1.6" /> Membros
            </a>
            @if (p.role === 'ADMIN') {
              <a class="item" [routerLink]="['/projetos', p.id, 'configuracoes']" [class.active]="section() === 'configuracoes'" (click)="close()">
                <app-icon name="settings" [size]="18" [stroke]="1.6" /> Configurações
              </a>
            }
          </nav>
        </div>
      }

      <div class="spacer"></div>

      <button class="user" (click)="logout()">
        <app-avatar [name]="userName()" [size]="26" />
        <span class="uname">{{ userName() }}</span>
        <app-icon name="logout" [size]="15" [stroke]="1.8" />
      </button>
    </aside>
  `,
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly projects = inject(ProjectsService);
  private readonly layout = inject(LayoutService);

  protected readonly project = this.projects.current;
  protected readonly userName = computed(() => this.auth.user()?.name ?? '');

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly section = computed(() => {
    const u = this.url().split('?')[0];
    const m = u.match(/^\/projetos\/[^/]+\/([^/]+)/);
    if (m) return m[1];
    if (u === '/projetos' || u === '/') return 'projetos';
    return '';
  });

  protected close(): void {
    this.layout.closeSidebar();
  }

  protected goProjects(): void {
    this.close();
    this.router.navigateByUrl('/projetos');
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/entrar');
  }
}
