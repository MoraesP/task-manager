import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
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

interface Linha {
  chave: string;
  rotulo: string;
  valor: number;
  percentual: number;
  tom: string;
}

@Component({
  selector: 'app-report-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopbarComponent, RoleBadgeComponent, PageLoaderComponent],
  templateUrl: './report.page.html',
  styleUrl: './report.page.scss',
})
export class ReportPage {
  private readonly servicoDeRelatorio = inject(ReportService);
  private readonly servicoDeProjetos = inject(ProjectsService);

  protected readonly projeto = this.servicoDeProjetos.projetoAtual;

  protected readonly carregando = signal(true);
  protected readonly relatorio = signal<ProjectReport | null>(null);

  protected readonly total = computed(() => {
    const relatorioAtual = this.relatorio();
    return relatorioAtual
      ? Object.values(relatorioAtual.byStatus).reduce((soma, valor) => soma + valor, 0)
      : 0;
  });

  protected readonly linhasDeStatus = computed<Linha[]>(() => this.linhas('status'));
  protected readonly linhasDePrioridade = computed<Linha[]>(() => this.linhas('priority'));

  constructor() {
    effect(() => {
      const projetoAtual = this.projeto();
      if (!projetoAtual) {
        return;
      }
      this.carregando.set(true);
      this.servicoDeRelatorio.doProjeto(projetoAtual.id).subscribe({
        next: (relatorioAtual) => {
          this.relatorio.set(relatorioAtual);
          this.carregando.set(false);
        },
        error: () => this.carregando.set(false),
      });
    });
  }

  private linhas(tipo: 'status' | 'priority'): Linha[] {
    const relatorioAtual = this.relatorio();
    if (!relatorioAtual) {
      return [];
    }
    const total = this.total() || 1;
    if (tipo === 'status') {
      const tons: Record<string, string> = { TODO: 'gray', IN_PROGRESS: 'blue', DONE: 'green' };
      return TASK_STATUSES.map((chave) => ({
        chave,
        rotulo: STATUS_LABEL[chave],
        valor: relatorioAtual.byStatus[chave],
        percentual: (relatorioAtual.byStatus[chave] / total) * 100,
        tom: tons[chave],
      }));
    }
    const tons: Record<string, string> = {
      LOW: 'gray',
      MEDIUM: 'blue',
      HIGH: 'amber',
      CRITICAL: 'red',
    };
    return TASK_PRIORITIES.map((chave) => ({
      chave,
      rotulo: PRIORITY_LABEL[chave],
      valor: relatorioAtual.byPriority[chave],
      percentual: (relatorioAtual.byPriority[chave] / total) * 100,
      tom: tons[chave],
    }));
  }
}
