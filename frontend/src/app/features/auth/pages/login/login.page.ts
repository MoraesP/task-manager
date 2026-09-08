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
      if (e) {
        this.form.controls.email.setValue(e);
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.retorno() || '/projetos'),
      error: () => this.loading.set(false),
    });
  }
}
