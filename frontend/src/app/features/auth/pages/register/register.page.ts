import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/notifications/toast.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { AuthCardComponent } from '../../ui/auth-card/auth-card.component';

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent, SpinnerComponent],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly autenticacao = inject(AuthService);
  private readonly roteador = inject(Router);
  private readonly notificacoes = inject(ToastService);

  protected readonly carregando = signal(false);

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected enviar(): void {
    if (this.form.invalid || this.carregando()) {
      return;
    }
    this.carregando.set(true);
    const { name, email, password } = this.form.getRawValue();
    this.autenticacao.registrar(name, email, password).subscribe({
      next: () => {
        this.notificacoes.sucesso('Conta criada. Faça login para continuar.');
        this.roteador.navigate(['/entrar'], { queryParams: { email } });
      },
      error: () => this.carregando.set(false),
    });
  }
}
