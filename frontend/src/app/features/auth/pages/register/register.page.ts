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
    if (this.form.invalid || this.loading()) {
      return;
    }
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
