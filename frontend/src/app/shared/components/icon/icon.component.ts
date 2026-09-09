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
  private readonly sanitizador = inject(DomSanitizer);

  readonly nome = input.required<IconName>();
  readonly tamanho = input(18);
  readonly traco = input(1.7);

  protected readonly conteudo = computed<SafeHtml>(() =>
    this.sanitizador.bypassSecurityTrustHtml(ICON_PATHS[this.nome()]),
  );
}
