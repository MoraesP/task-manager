import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const TONES = ['blue', 'green', 'amber', 'plum', 'slate'] as const;

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly name = input('');
  readonly size = input(26);
  readonly you = input(false);

  protected readonly initials = computed(() => {
    if (this.you()) {
      return 'EU';
    }
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly tone = computed(() => {
    const s = this.name();
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return TONES[h % TONES.length];
  });
}
