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
    if (this.form.controls.token.invalid || this.loading()) {
      return;
    }
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
