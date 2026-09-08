import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '@shared/models';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ProjectsService } from '../../data/projects.service';

@Component({
  selector: 'app-create-project-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconComponent, SpinnerComponent],
  templateUrl: './create-project-dialog.component.html',
})
export class CreateProjectDialogComponent {
  protected readonly ref = inject<DialogRef<Project | undefined>>(DialogRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly projects = inject(ProjectsService);

  protected readonly loading = signal(false);
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.loading.set(true);
    const { name, description } = this.form.getRawValue();
    this.projects.create(name, description).subscribe({
      next: (p) => this.ref.close(p),
      error: () => this.loading.set(false),
    });
  }
}
