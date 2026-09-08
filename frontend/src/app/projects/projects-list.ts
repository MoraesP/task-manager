import { Dialog } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { PageResponse, Project } from '../core/models';
import { AvatarComponent } from '../shared/avatar';
import { RoleBadgeComponent } from '../shared/badges';
import { IconComponent } from '../shared/icon';
import { PaginatorComponent } from '../shared/paginator';
import { EmptyStateComponent, PageLoaderComponent } from '../shared/ui';
import { TopbarComponent } from '../shell/topbar';
import { CreateProjectDialogComponent } from './create-project-dialog';
import { ProjectsService } from './projects.service';

@Component({
  selector: 'app-projects-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    TopbarComponent,
    IconComponent,
    AvatarComponent,
    RoleBadgeComponent,
    PaginatorComponent,
    EmptyStateComponent,
    PageLoaderComponent,
  ],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.scss',
})
export class ProjectsListComponent {
  private readonly service = inject(ProjectsService);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly data = signal<PageResponse<Project> | null>(null);
  protected readonly page = signal(0);

  constructor() {
    this.fetch(0);
  }

  protected fetch(page: number): void {
    this.loading.set(true);
    this.page.set(page);
    this.service.page(page).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected isOwner(p: Project): boolean {
    return p.ownerId === this.auth.user()?.id;
  }

  protected create(): void {
    this.dialog
      .open<Project | undefined>(CreateProjectDialogComponent, { hasBackdrop: true })
      .closed.subscribe((project) => {
        if (project) this.router.navigate(['/projetos', project.id, 'quadro']);
      });
  }
}
