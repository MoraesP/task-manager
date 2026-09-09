import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { AuthCardComponent } from '../../ui/auth-card/auth-card.component';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent, SpinnerComponent, IconComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly autenticacao = inject(AuthService);
  private readonly roteador = inject(Router);

  readonly retorno = input<string>();
  readonly email = input<string>();

  protected readonly mostrarSenha = signal(false);
  protected readonly carregando = signal(false);

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const emailDoLink = this.email();
      if (emailDoLink) {
        this.form.controls.email.setValue(emailDoLink);
      }
    });
  }

  protected enviar(): void {
    if (this.form.invalid || this.carregando()) {
      return;
    }
    this.carregando.set(true);
    const { email, password } = this.form.getRawValue();
    this.autenticacao.entrar(email, password).subscribe({
      next: () => this.roteador.navigateByUrl(this.retorno() || '/projetos'),
      error: () => this.carregando.set(false),
    });
  }
}
