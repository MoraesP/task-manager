import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-page-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpinnerComponent],
  templateUrl: './page-loader.component.html',
  styleUrl: './page-loader.component.scss',
})
export class PageLoaderComponent {}
