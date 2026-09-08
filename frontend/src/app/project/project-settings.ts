import { Dialog } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { ProjectsService } from '../projects/projects.service';
import { RoleBadgeComponent } from '../shared/badges';
import { ConfirmDialogComponent } from '../shared/confirm-dialog';
import { SpinnerComponent } from '../shared/ui';
import { TopbarComponent } from '../shell/topbar';

@Component({
  selector: 'app-project-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, TopbarComponent, RoleBadgeComponent, SpinnerComponent],
  templateUrl: './project-settings.html',
  styleUrl: './project-settings.scss',
})
export class ProjectSettingsComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly projects = inject(ProjectsService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly project = this.projects.current;
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  constructor() {
    effect(() => {
      const p = this.project();
      if (p) {
        this.form.reset({ name: p.name, description: p.description ?? '' });
      }
    });
  }

  protected isOwner(): boolean {
    return this.project()?.ownerId === this.auth.user()?.id;
  }

  protected save(): void {
    const p = this.project();
    if (!p || this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const { name, description } = this.form.getRawValue();
    this.projects.update(p.id, name, description).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.toast.success('Projeto atualizado.');
      },
      error: () => this.saving.set(false),
    });
  }

  protected confirmDelete(): void {
    const p = this.project();
    if (!p) return;
    this.dialog
      .open<boolean>(ConfirmDialogComponent, {
        hasBackdrop: true,
        data: {
          title: `Excluir “${p.name}”?`,
          message:
            'Isso remove permanentemente o projeto, todas as tarefas, o histórico, os membros e os convites. A ação é irreversível.',
          confirmLabel: 'Excluir projeto',
          danger: true,
        },
      })
      .closed.subscribe((ok) => {
        if (ok) {
          this.projects.remove(p.id).subscribe({
            next: () => {
              this.toast.success('Projeto excluído.');
              this.router.navigateByUrl('/projetos');
            },
          });
        }
      });
  }
}
