import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatedInvitation, Invitation, Role } from '@shared/models';
import { ToastService } from '@core/notifications/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { MembersService } from '../../data/members.service';

@Component({
  selector: 'app-invite-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, IconComponent, SpinnerComponent],
  templateUrl: './invite-dialog.component.html',
  styleUrl: './invite-dialog.component.scss',
})
export class InviteDialogComponent {
  private readonly notificacoes = inject(ToastService);
  private readonly servicoDeMembros = inject(MembersService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  private readonly dados = inject<{ projetoId: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<Invitation | undefined>>(DialogRef);

  protected readonly carregando = signal(false);
  protected readonly conviteCriado = signal<CreatedInvitation | null>(null);

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['MEMBER' as Role],
  });

  protected linkDoConvite(): string {
    const convite = this.conviteCriado();
    return convite ? `${location.origin}/convite?token=${convite.token}` : '';
  }

  protected enviar(): void {
    if (this.form.invalid || this.carregando()) {
      return;
    }
    this.carregando.set(true);
    const { email, role } = this.form.getRawValue();
    this.servicoDeMembros.convidar(this.dados.projetoId, email, role).subscribe({
      next: (convite) => {
        this.conviteCriado.set(convite);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  protected copiar(valor: string): void {
    navigator.clipboard?.writeText(valor).then(
      () => this.notificacoes.sucesso('Link copiado.'),
      () => void 0,
    );
  }

  protected limpar(): void {
    this.conviteCriado.set(null);
    this.form.reset({ email: '', role: 'MEMBER' });
  }

  protected fechar(): void {
    this.ref.close(this.conviteCriado() ? this.paraConvite() : undefined);
  }

  private paraConvite(): Invitation {
    const convite = this.conviteCriado()!;
    return {
      id: convite.id,
      email: convite.email,
      role: convite.role,
      status: 'PENDING',
      expiresAt: convite.expiresAt,
    };
  }
}
