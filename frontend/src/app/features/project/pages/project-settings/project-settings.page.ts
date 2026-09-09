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
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly servicoDeProjetos = inject(ProjectsService);
  private readonly autenticacao = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly notificacoes = inject(ToastService);
  private readonly roteador = inject(Router);

  protected readonly projeto = this.servicoDeProjetos.projetoAtual;
  protected readonly salvando = signal(false);

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
  });

  constructor() {
    effect(() => {
      const projeto = this.projeto();
      if (projeto) {
        this.form.reset({ name: projeto.name, description: projeto.description ?? '' });
      }
    });
  }

  protected ehDono(): boolean {
    return this.projeto()?.ownerId === this.autenticacao.usuario()?.id;
  }

  protected salvar(): void {
    const projeto = this.projeto();
    if (!projeto || this.form.invalid || this.salvando()) {
      return;
    }
    this.salvando.set(true);
    const { name, description } = this.form.getRawValue();
    this.servicoDeProjetos.atualizar(projeto.id, name, description).subscribe({
      next: () => {
        this.salvando.set(false);
        this.form.markAsPristine();
        this.notificacoes.sucesso('Projeto atualizado.');
      },
      error: () => this.salvando.set(false),
    });
  }

  protected descartar(): void {
    const projeto = this.projeto();
    if (projeto) {
      this.form.reset({ name: projeto.name, description: projeto.description ?? '' });
    }
  }

  protected confirmarExclusao(): void {
    const projeto = this.projeto();
    if (!projeto) {
      return;
    }
    this.dialog
      .open<boolean>(ConfirmDialogComponent, {
        hasBackdrop: true,
        data: {
          titulo: `Excluir “${projeto.name}”?`,
          mensagem:
            'Isso remove permanentemente o projeto, todas as tarefas, o histórico, os membros e os convites. A ação é irreversível.',
          rotuloConfirmar: 'Excluir projeto',
          perigo: true,
        },
      })
      .closed.subscribe((confirmado) => {
        if (confirmado) {
          this.servicoDeProjetos.excluir(projeto.id).subscribe({
            next: () => {
              this.notificacoes.sucesso('Projeto excluído.');
              this.roteador.navigateByUrl('/projetos');
            },
          });
        }
      });
  }
}
