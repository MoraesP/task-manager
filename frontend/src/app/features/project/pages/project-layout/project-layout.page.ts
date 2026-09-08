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
import { errorMessage } from '@core/http/problem-detail';
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
  private readonly projects = inject(ProjectsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly projectId = input.required<string>();
  protected readonly ready = signal(false);

  constructor() {
    effect(() => {
      const id = this.projectId();
      this.ready.set(false);
      this.projects.load(id).subscribe({
        next: () => this.ready.set(true),
        error: (err) => {
          this.toast.error(errorMessage(err, 'Projeto indisponível.'));
          this.router.navigateByUrl('/projetos');
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.projects.clearCurrent();
  }
}
