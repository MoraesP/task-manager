import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/notifications/toast.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { AuthCardComponent } from '../../ui/auth-card/auth-card.component';

@Component({
  selector: 'app-accept-invitation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent, SpinnerComponent],
  templateUrl: './accept-invitation.page.html',
  styleUrl: './accept-invitation.page.scss',
})
export class AcceptInvitationPage {
  private readonly roteador = inject(Router);
  private readonly autenticacao = inject(AuthService);
  private readonly notificacoes = inject(ToastService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly token = input<string>();

  protected readonly carregando = signal(false);
  protected readonly temTokenNoLink = signal(false);

  protected readonly form = this.formBuilder.group({
    token: ['', [Validators.required]],
    name: [''],
    password: [''],
  });

  constructor() {
    effect(() => {
      const tokenDoLink = this.token();
      if (tokenDoLink) {
        this.form.controls.token.setValue(tokenDoLink);
        this.temTokenNoLink.set(true);
      }
    });
  }

  protected enviar(): void {
    if (this.form.controls.token.invalid || this.carregando()) {
      return;
    }
    this.carregando.set(true);
    const { token, name, password } = this.form.getRawValue();
    this.autenticacao.aceitarConvite(token, name, password).subscribe({
      next: () => {
        this.notificacoes.sucesso('Convite aceito. Bem-vindo ao projeto!');
        this.roteador.navigateByUrl('/projetos');
      },
      error: () => this.carregando.set(false),
    });
  }
}
