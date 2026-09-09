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
  private readonly dialog = inject(Dialog);
  private readonly roteador = inject(Router);
  private readonly autenticacao = inject(AuthService);
  private readonly servicoDeProjetos = inject(ProjectsService);

  protected readonly carregando = signal(true);

  protected readonly numeroDaPagina = signal(0);
  protected readonly pagina = signal<PageResponse<Project> | null>(null);

  constructor() {
    this.buscar(0);
  }

  protected buscar(numeroDaPagina: number): void {
    this.carregando.set(true);
    this.numeroDaPagina.set(numeroDaPagina);
    this.servicoDeProjetos.pagina(numeroDaPagina).subscribe({
      next: (resposta) => {
        this.pagina.set(resposta);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  protected ehDono(projeto: Project): boolean {
    return projeto.ownerId === this.autenticacao.usuario()?.id;
  }

  protected criar(): void {
    this.dialog
      .open<Project | undefined>(CreateProjectDialogComponent, { hasBackdrop: true })
      .closed.subscribe((projeto) => {
        if (projeto) {
          this.roteador.navigate(['/projetos', projeto.id, 'quadro']);
        }
      });
  }
}
