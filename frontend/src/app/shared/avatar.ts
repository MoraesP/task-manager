import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const TONES = ['a-blue', 'a-green', 'a-amber', 'a-plum', 'a-slate'];

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="avatar" [class]="tone()" [style.width.px]="size()" [style.height.px]="size()"
    [style.fontSize.px]="size() * 0.4" [title]="name()">{{ initials() }}</span>`,
  styles: `
    .avatar {
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
      background: var(--surface-2);
      color: var(--text-2);
      border: 1px solid var(--border-strong);
      user-select: none;
    }
    .a-blue { background: #e5ecfb; color: #3358a8; border-color: #cfddf7; }
    .a-green { background: #e6f2ea; color: #2f7350; border-color: #d0e6d8; }
    .a-amber { background: #f7efe0; color: #8a5c17; border-color: #ecdcbf; }
    .a-plum { background: #efe7f4; color: #6e4a86; border-color: #e0d0ea; }
    .a-slate { background: #e8e6e2; color: #5b554d; border-color: #dcd8d0; }
  `,
})
export class AvatarComponent {
  readonly name = input('');
  readonly size = input(26);
  readonly you = input(false);

  protected readonly initials = computed(() => {
    if (this.you()) return 'EU';
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly tone = computed(() => {
    const s = this.name();
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return TONES[h % TONES.length];
  });
}
