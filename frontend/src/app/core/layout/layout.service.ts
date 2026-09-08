import { Injectable, signal } from '@angular/core';

/** Estado do menu lateral em telas estreitas (slide-over). */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly _sidebarOpen = signal(false);
  readonly sidebarOpen = this._sidebarOpen.asReadonly();

  openSidebar(): void {
    this._sidebarOpen.set(true);
  }
  closeSidebar(): void {
    this._sidebarOpen.set(false);
  }
  toggleSidebar(): void {
    this._sidebarOpen.update((v) => !v);
  }
}
