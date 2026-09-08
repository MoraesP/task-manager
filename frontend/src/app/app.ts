import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from '@core/notifications/toast-host/toast-host.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastHostComponent],
  templateUrl: './app.html',
})
export class App {}
