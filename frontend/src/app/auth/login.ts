import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { SpinnerComponent } from '../shared/ui';
import { AuthCardComponent } from './auth-card';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent, SpinnerComponent],
  template: `
    <app-auth-card>
      <h1>Entrar</h1>
      <p class="lead">Acesse seus projetos e tarefas.</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label class="label" for="email">E-mail</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div class="field">
          <label class="label" for="senha">Senha</label>
          <div class="pw">
            <input
              id="senha"
              class="input"
              [type]="show() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
            />
            <button type="button" class="eye" (click)="show.set(!show())" aria-label="Mostrar senha">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <button class="btn primary block lg" type="submit" [disabled]="form.invalid || loading()">
          @if (loading()) { <app-spinner [size]="15" /> } @else { Entrar }
        </button>
      </form>

      <div class="sep"><span>novo por aqui?</span></div>
      <a routerLink="/cadastro" class="alt">Criar uma conta</a>
    </app-auth-card>
  `,
  styles: `
    h1 { font-size: 21px; font-weight: 700; }
    .lead { color: var(--text-2); font-size: 13px; margin: 4px 0 22px; }
    form { display: flex; flex-direction: column; gap: 14px; }
    .pw { position: relative; }
    .eye { position: absolute; right: 8px; top: 8px; color: var(--text-3); background: none; border: none; cursor: pointer; padding: 2px; }
    .sep { display: flex; align-items: center; gap: 10px; margin: 20px 0 14px; color: var(--text-3); font-size: 12px; }
    .sep::before, .sep::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .alt { display: block; text-align: center; font-weight: 600; font-size: 13px; }
  `,
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly retorno = input<string>();
  readonly email = input<string>();

  protected readonly show = signal(false);
  protected readonly loading = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const e = this.email();
      if (e) this.form.controls.email.setValue(e);
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.retorno() || '/projetos'),
      error: () => this.loading.set(false),
    });
  }
}
