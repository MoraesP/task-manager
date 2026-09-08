import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/report-page/report.page').then((m) => m.ReportPage),
  },
];
