import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '../core/models';
import { IconComponent } from '../shared/icon';
import { SpinnerComponent } from '../shared/ui';
import { ProjectsService } from './projects.service';

@Component({
  selector: 'app-create-project-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconComponent, SpinnerComponent],
  template: `
    <div class="modal">
      <div class="modal-head">
        <h3>Novo projeto</h3>
        <button class="modal-close" (click)="ref.close()" aria-label="Fechar"><app-icon name="x" [size]="18" /></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="modal-body">
          <div class="field">
            <label class="label" for="np-name">Nome</label>
            <input id="np-name" class="input" formControlName="name" autofocus />
          </div>
          <div class="field">
            <label class="label" for="np-desc">Descrição <span class="hint">(opcional)</span></label>
            <textarea id="np-desc" class="input" rows="3" formControlName="description"></textarea>
          </div>
          <p class="hint">Você será o dono e Admin do projeto.</p>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost" (click)="ref.close()">Cancelar</button>
          <button type="submit" class="btn primary" [disabled]="form.invalid || loading()">
            @if (loading()) { <app-spinner [size]="14" /> } @else { Criar projeto }
          </button>
        </div>
      </form>
    </div>
  `,
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
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const { name, description } = this.form.getRawValue();
    this.projects.create(name, description).subscribe({
      next: (p) => this.ref.close(p),
      error: () => this.loading.set(false),
    });
  }
}
