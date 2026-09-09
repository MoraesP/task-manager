import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastService } from '@core/notifications/toast.service';
import { mensagemDeErro } from '@core/http/problem-detail';
import { ProjectsService } from '@features/projects/data/projects.service';
import { PageLoaderComponent } from '@shared/components/page-loader/page-loader.component';

@Component({
  selector: 'app-project-layout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, PageLoaderComponent],
  templateUrl: './project-layout.page.html',
  styleUrl: './project-layout.page.scss',
})
export class ProjectLayoutPage implements OnDestroy {
  private readonly roteador = inject(Router);
  private readonly notificacoes = inject(ToastService);
  private readonly servicoDeProjetos = inject(ProjectsService);

  readonly projectId = input.required<string>();
  protected readonly pronto = signal(false);

  constructor() {
    effect(() => {
      const id = this.projectId();
      this.pronto.set(false);
      this.servicoDeProjetos.carregar(id).subscribe({
        next: () => this.pronto.set(true),
        error: (erro) => {
          this.notificacoes.erro(mensagemDeErro(erro, 'Projeto indisponível.'));
          this.roteador.navigateByUrl('/projetos');
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.servicoDeProjetos.limparAtual();
  }
}
