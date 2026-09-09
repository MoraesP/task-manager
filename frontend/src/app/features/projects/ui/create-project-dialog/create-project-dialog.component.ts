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
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly servicoDeProjetos = inject(ProjectsService);

  protected readonly carregando = signal(false);
  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  protected enviar(): void {
    if (this.form.invalid || this.carregando()) {
      return;
    }
    this.carregando.set(true);
    const { name, description } = this.form.getRawValue();
    this.servicoDeProjetos.criar(name, description).subscribe({
      next: (projeto) => this.ref.close(projeto),
      error: () => this.carregando.set(false),
    });
  }
}
