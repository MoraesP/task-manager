import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import {
  PRIORITY_LABEL,
  ProjectReport,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '@shared/models';
import { ProjectsService } from '@features/projects/data/projects.service';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { PageLoaderComponent } from '@shared/components/page-loader/page-loader.component';
import { TopbarComponent } from '@shared/components/topbar/topbar.component';
import { ReportService } from '../../data/report.service';

interface Row {
  key: string;
  label: string;
  value: number;
  pct: number;
  tone: string;
}

@Component({
  selector: 'app-report-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopbarComponent, RoleBadgeComponent, PageLoaderComponent],
  templateUrl: './report.page.html',
  styleUrl: './report.page.scss',
})
export class ReportPage {
  private readonly service = inject(ReportService);
  private readonly projects = inject(ProjectsService);

  protected readonly project = this.projects.current;
  protected readonly loading = signal(true);
  protected readonly report = signal<ProjectReport | null>(null);

  protected readonly total = computed(() => {
    const r = this.report();
    return r ? Object.values(r.byStatus).reduce((a, b) => a + b, 0) : 0;
  });

  protected readonly statusRows = computed<Row[]>(() => this.rows('status'));
  protected readonly priorityRows = computed<Row[]>(() => this.rows('priority'));

  constructor() {
    effect(() => {
      const p = this.project();
      if (!p) {
        return;
      }
      this.loading.set(true);
      this.service.forProject(p.id).subscribe({
        next: (r) => {
          this.report.set(r);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  private rows(kind: 'status' | 'priority'): Row[] {
    const r = this.report();
    if (!r) {
      return [];
    }
    const total = this.total() || 1;
    if (kind === 'status') {
      const tones: Record<string, string> = { TODO: 'gray', IN_PROGRESS: 'blue', DONE: 'green' };
      return TASK_STATUSES.map((k) => ({
        key: k,
        label: STATUS_LABEL[k],
        value: r.byStatus[k],
        pct: (r.byStatus[k] / total) * 100,
        tone: tones[k],
      }));
    }
    const tones: Record<string, string> = {
      LOW: 'gray',
      MEDIUM: 'blue',
      HIGH: 'amber',
      CRITICAL: 'red',
    };
    return TASK_PRIORITIES.map((k) => ({
      key: k,
      label: PRIORITY_LABEL[k],
      value: r.byPriority[k],
      pct: (r.byPriority[k] / total) * 100,
      tone: tones[k],
    }));
  }
}
