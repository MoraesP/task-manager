import { Dialog } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/notifications/toast.service';
import { ProjectsService } from '@features/projects/data/projects.service';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import {
  ConfirmDialogComponent,
} from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { TopbarComponent } from '@shared/components/topbar/topbar.component';

@Component({
  selector: 'app-project-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, TopbarComponent, RoleBadgeComponent, SpinnerComponent],
  templateUrl: './project-settings.page.html',
  styleUrl: './project-settings.page.scss',
})
export class ProjectSettingsPage {
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
    if (!p || this.form.invalid || this.saving()) {
      return;
    }
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

  protected discard(): void {
    const p = this.project();
    if (p) {
      this.form.reset({ name: p.name, description: p.description ?? '' });
    }
  }

  protected confirmDelete(): void {
    const p = this.project();
    if (!p) {
      return;
    }
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
