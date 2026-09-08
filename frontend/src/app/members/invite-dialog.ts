import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatedInvitation, Invitation, Role } from '../core/models';
import { ToastService } from '../core/toast.service';
import { IconComponent } from '../shared/icon';
import { SpinnerComponent } from '../shared/ui';
import { MembersService } from './members.service';

@Component({
  selector: 'app-invite-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, IconComponent, SpinnerComponent],
  template: `
    <div class="modal">
      <div class="modal-head">
        <h3>Convidar membro</h3>
        <button class="modal-close" (click)="ref.close()" aria-label="Fechar"><app-icon name="x" [size]="18" /></button>
      </div>
      <div class="modal-body">
        @if (!created()) {
          <form [formGroup]="form" (ngSubmit)="submit()" class="stack" style="gap:12px">
            <div class="row">
              <div class="field" style="flex:1">
                <label class="label" for="inv-email">E-mail</label>
                <input id="inv-email" class="input" type="email" formControlName="email" />
              </div>
              <div class="field" style="width:140px">
                <label class="label" for="inv-role">Papel</label>
                <select id="inv-role" class="input" formControlName="role">
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <button class="btn primary" type="submit" [disabled]="form.invalid || loading()">
              @if (loading()) { <app-spinner [size]="14" /> } @else { Gerar convite }
            </button>
          </form>
        } @else {
          <div class="callout info">
            <div style="font-weight:700;margin-bottom:6px">
              Convite gerado · expira {{ created()!.expiresAt | date: 'dd/MM/yyyy' }}
            </div>
            <div class="link-row">
              <input class="input mono" style="flex:1;font-size:11.5px" readonly [value]="link()" #linkInput />
              <button class="btn sm" (click)="copy(linkInput.value)">
                <app-icon name="copy" [size]="13" [stroke]="1.8" /> Copiar
              </button>
            </div>
            <div style="margin-top:8px;font-size:11.5px">
              Não enviamos e-mail — envie este link para a pessoa. Ao aceitar, ela cria a conta (se
              ainda não tiver) e entra no projeto.
            </div>
          </div>
        }
      </div>
      <div class="modal-foot">
        @if (created()) {
          <button class="btn ghost" (click)="reset()">Convidar outra pessoa</button>
        }
        <button class="btn" [class.primary]="!!created()" (click)="close()">
          {{ created() ? 'Concluir' : 'Cancelar' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .row { display: flex; gap: 12px; }
    .link-row { display: flex; gap: 8px; align-items: center; }
  `,
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
    if (this.form.invalid || this.loading()) return;
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
