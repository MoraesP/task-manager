import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { LayoutService } from '@core/layout/layout.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  protected readonly layout = inject(LayoutService);
  readonly titulo = input.required<string>();
  readonly trilha = input<string>();
}
