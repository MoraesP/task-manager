import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-auth-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './auth-card.component.html',
  styleUrl: './auth-card.component.scss',
})
export class AuthCardComponent {}
