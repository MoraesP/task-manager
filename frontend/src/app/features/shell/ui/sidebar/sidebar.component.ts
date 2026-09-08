import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LayoutService } from '@core/layout/layout.service';
import { ProjectsService } from '@features/projects/data/projects.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, AvatarComponent, RoleBadgeComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
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
    if (m) {
      return m[1];
    }
    if (u === '/projetos' || u === '/') {
      return 'projetos';
    }
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
