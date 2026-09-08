import { Dialog } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { PageResponse, Project } from '@shared/models';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { PaginatorComponent } from '@shared/components/paginator/paginator.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { PageLoaderComponent } from '@shared/components/page-loader/page-loader.component';
import { TopbarComponent } from '@shared/components/topbar/topbar.component';
import { CreateProjectDialogComponent } from '../../ui/create-project-dialog/create-project-dialog.component';
import { ProjectsService } from '../../data/projects.service';

@Component({
  selector: 'app-projects-list-page',
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
  templateUrl: './projects-list.page.html',
  styleUrl: './projects-list.page.scss',
})
export class ProjectsListPage {
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
        if (project) {
          this.router.navigate(['/projetos', project.id, 'quadro']);
        }
      });
  }
}
