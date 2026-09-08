import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconComponent } from './icon';

export interface ConfirmData {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="modal" style="width:min(440px, calc(100vw - 32px))">
      <div class="modal-head">
        @if (data.danger) {
          <span style="color:var(--red);flex-shrink:0;margin-top:1px"><app-icon name="alert" [size]="20" [stroke]="1.8" /></span>
        }
        <h3>{{ data.title }}</h3>
      </div>
      <div class="modal-body"><p style="color:var(--text-2);line-height:1.5">{{ data.message }}</p></div>
      <div class="modal-foot">
        <button class="btn ghost" (click)="ref.close(false)">Cancelar</button>
        <button class="btn" [class.danger]="data.danger" [class.primary]="!data.danger" (click)="ref.close(true)">
          {{ data.confirmLabel ?? 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<ConfirmData>(DIALOG_DATA);
}
