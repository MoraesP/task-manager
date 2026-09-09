import { Injectable, signal } from '@angular/core';

/** Estado do menu lateral em telas estreitas (slide-over). */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly _menuLateralAberto = signal(false);
  readonly menuLateralAberto = this._menuLateralAberto.asReadonly();

  abrirMenuLateral(): void {
    this._menuLateralAberto.set(true);
  }

  fecharMenuLateral(): void {
    this._menuLateralAberto.set(false);
  }

  alternarMenuLateral(): void {
    this._menuLateralAberto.update((aberto) => !aberto);
  }
}
