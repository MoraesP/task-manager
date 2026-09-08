import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, input, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastService } from '../core/toast.service';
import { errorMessage } from '../core/problem-detail';
import { ProjectsService } from '../projects/projects.service';
import { PageLoaderComponent } from '../shared/ui';

@Component({
  selector: 'app-project-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, PageLoaderComponent],
  template: `
    @if (ready()) {
      <router-outlet />
    } @else {
      <app-page-loader />
    }
  `,
  styles: `:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }`,
})
export class ProjectLayoutComponent implements OnDestroy {
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
