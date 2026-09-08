import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_PATHS, IconName } from './icon-paths';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>();
  readonly size = input(18);
  readonly stroke = input(1.7);

  protected readonly markup = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICON_PATHS[this.name()]),
  );
}
