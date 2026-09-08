import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { SpinnerComponent } from '../shared/ui';
import { AuthCardComponent } from './auth-card';

@Component({
  selector: 'app-accept-invitation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthCardComponent, SpinnerComponent],
  template: `
    <app-auth-card>
      <h1>Aceitar convite</h1>
      <p class="lead">Entre no projeto para o qual você foi convidado.</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label class="label" for="token">Token do convite</label>
          <input id="token" class="input mono" type="text" formControlName="token" [readonly]="hasLinkToken()" />
          @if (!hasLinkToken()) {
            <span class="hint">Cole aqui o token que você recebeu.</span>
          }
        </div>
        <div class="field">
          <label class="label" for="nome">Nome</label>
          <input id="nome" class="input" type="text" formControlName="name" autocomplete="name" />
          <span class="hint">Ignorado se você já tem conta com este e-mail.</span>
        </div>
        <div class="field">
          <label class="label" for="senha">Senha</label>
          <input
            id="senha"
            class="input"
            type="password"
            formControlName="password"
            autocomplete="new-password"
            placeholder="Deixe em branco se já tem conta"
          />
        </div>
        <button class="btn primary block lg" type="submit" [disabled]="form.controls.token.invalid || loading()">
          @if (loading()) { <app-spinner [size]="15" /> } @else { Aceitar convite e entrar }
        </button>
      </form>

      <div class="sep"><span></span></div>
      <a routerLink="/entrar" class="alt">Voltar para o login</a>
    </app-auth-card>
  `,
  styles: `
    h1 { font-size: 21px; font-weight: 700; }
    .lead { color: var(--text-2); font-size: 13px; margin: 4px 0 22px; }
    form { display: flex; flex-direction: column; gap: 14px; }
    .sep { height: 1px; background: var(--border); margin: 18px 0 14px; }
    .alt { display: block; text-align: center; font-weight: 600; font-size: 13px; }
  `,
})
export class AcceptInvitationComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly token = input<string>();

  protected readonly loading = signal(false);
  protected readonly hasLinkToken = signal(false);

  protected readonly form = this.fb.group({
    token: ['', [Validators.required]],
    name: [''],
    password: [''],
  });

  constructor() {
    effect(() => {
      const t = this.token();
      if (t) {
        this.form.controls.token.setValue(t);
        this.hasLinkToken.set(true);
      }
    });
  }

  protected submit(): void {
    if (this.form.controls.token.invalid || this.loading()) return;
    this.loading.set(true);
    const { token, name, password } = this.form.getRawValue();
    this.auth.acceptInvitation(token, name, password).subscribe({
      next: () => {
        this.toast.success('Convite aceito. Bem-vindo ao projeto!');
        this.router.navigateByUrl('/projetos');
      },
      error: () => this.loading.set(false),
    });
  }
}
