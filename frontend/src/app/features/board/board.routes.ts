import { Routes } from '@angular/router';

export const BOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/board-page/board.page').then((modulo) => modulo.BoardPage),
  },
];
