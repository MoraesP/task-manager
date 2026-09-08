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
  protected readonly ref = inject<DialogRef<Invitation | undefined>>(DialogRef);
  private readonly data = inject<{ projectId: string }>(DIALOG_DATA);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly members = inject(MembersService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly created = signal<CreatedInvitation | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['MEMBER' as Role],
  });

  protected link(): string {
    const c = this.created();
    return c ? `${location.origin}/convite?token=${c.token}` : '';
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.loading.set(true);
    const { email, role } = this.form.getRawValue();
    this.members.invite(this.data.projectId, email, role).subscribe({
      next: (c) => {
        this.created.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected copy(value: string): void {
    navigator.clipboard?.writeText(value).then(
      () => this.toast.success('Link copiado.'),
      () => void 0,
    );
  }

  protected reset(): void {
    this.created.set(null);
    this.form.reset({ email: '', role: 'MEMBER' });
  }

  protected close(): void {
    this.ref.close(this.created() ? this.toInvitation() : undefined);
  }

  private toInvitation(): Invitation {
    const c = this.created()!;
    return { id: c.id, email: c.email, role: c.role, status: 'PENDING', expiresAt: c.expiresAt };
  }
}
