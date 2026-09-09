import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const TONS = ['blue', 'green', 'amber', 'plum', 'slate'] as const;

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly nome = input('');
  readonly tamanho = input(26);
  readonly voce = input(false);

  protected readonly iniciais = computed(() => {
    if (this.voce()) {
      return 'EU';
    }
    const partes = this.nome().trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) {
      return '?';
    }
    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  });

  protected readonly tom = computed(() => {
    const nome = this.nome();
    let hash = 0;
    for (let indice = 0; indice < nome.length; indice++) {
      hash = (hash * 31 + nome.charCodeAt(indice)) >>> 0;
    }
    return TONS[hash % TONS.length];
  });
}
