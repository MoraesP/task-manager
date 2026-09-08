import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  protected readonly toast = inject(ToastService);
}
