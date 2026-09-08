import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

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
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<ConfirmData>(DIALOG_DATA);
}
