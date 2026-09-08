import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { SpinnerComponent } from '../shared/ui';
import { AuthCardComponent } from './auth-card';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent, SpinnerComponent],
  template: `
    <app-auth-card>
      <h1>Criar conta</h1>
      <p class="lead">Comece criando um projeto e convidando sua equipe.</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label class="label" for="nome">Nome</label>
          <input id="nome" class="input" type="text" formControlName="name" autocomplete="name" />
        </div>
        <div class="field">
          <label class="label" for="email">E-mail</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div class="field">
          <label class="label" for="senha">Senha</label>
          <input
            id="senha"
            class="input"
            type="password"
            formControlName="password"
            autocomplete="new-password"
          />
          <span class="hint">Mínimo de 8 caracteres.</span>
        </div>
        <button class="btn primary block lg" type="submit" [disabled]="form.invalid || loading()">
          @if (loading()) { <app-spinner [size]="15" /> } @else { Criar conta }
        </button>
      </form>

      <p class="invite">
        Recebeu um convite para um projeto?
        <a routerLink="/convite">Aceitar convite</a>
      </p>
      <div class="sep"><span>já tem conta?</span></div>
      <a routerLink="/entrar" class="alt">Entrar</a>
    </app-auth-card>
  `,
  styles: `
    h1 { font-size: 21px; font-weight: 700; }
    .lead { color: var(--text-2); font-size: 13px; margin: 4px 0 22px; }
    form { display: flex; flex-direction: column; gap: 14px; }
    .invite { font-size: 12px; color: var(--text-3); margin-top: 16px; text-align: center; }
    .sep { display: flex; align-items: center; gap: 10px; margin: 14px 0; color: var(--text-3); font-size: 12px; }
    .sep::before, .sep::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .alt { display: block; text-align: center; font-weight: 600; font-size: 13px; }
  `,
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const { name, email, password } = this.form.getRawValue();
    this.auth.register(name, email, password).subscribe({
      next: () => {
        this.toast.success('Conta criada. Faça login para continuar.');
        this.router.navigate(['/entrar'], { queryParams: { email } });
      },
      error: () => this.loading.set(false),
    });
  }
}
