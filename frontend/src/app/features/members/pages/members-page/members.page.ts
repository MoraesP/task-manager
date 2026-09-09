import { Dialog } from '@angular/cdk/dialog';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { API_BASE } from '@core/http/api.config';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/notifications/toast.service';
import { Invitation, PageResponse, ProjectMember, Role, Task } from '@shared/models';
import { ProjectsService } from '@features/projects/data/projects.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { RoleBadgeComponent } from '@shared/components/role-badge/role-badge.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { PageLoaderComponent } from '@shared/components/page-loader/page-loader.component';
import { TopbarComponent } from '@shared/components/topbar/topbar.component';
import { InviteDialogComponent } from '../../ui/invite-dialog/invite-dialog.component';
import {
  RemoveMemberDialogComponent,
  RemoveMemberData,
} from '../../ui/remove-member-dialog/remove-member-dialog.component';
import { MembersService } from '../../data/members.service';

@Component({
  selector: 'app-members-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'membroComMenuAberto.set(null)' },
  imports: [
    TopbarComponent,
    IconComponent,
    AvatarComponent,
    RoleBadgeComponent,
    PageLoaderComponent,
  ],
  templateUrl: './members.page.html',
  styleUrl: './members.page.scss',
})
export class MembersPage {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(Dialog);
  private readonly autenticacao = inject(AuthService);
  private readonly notificacoes = inject(ToastService);
  private readonly servicoDeMembros = inject(MembersService);
  private readonly servicoDeProjetos = inject(ProjectsService);

  protected readonly projeto = this.servicoDeProjetos.projetoAtual;
  protected readonly ehAdmin = computed(() => this.projeto()?.role === 'ADMIN');
  protected readonly aba = signal<'members' | 'invitations'>('members');

  protected readonly carregando = signal(true);
  protected readonly membros = signal<ProjectMember[]>([]);
  protected readonly convites = signal<Invitation[]>([]);
  protected readonly tarefas = signal<Task[]>([]);
  protected readonly membroComMenuAberto = signal<string | null>(null);

  protected readonly ativasPorResponsavel = computed<Record<string, number | undefined>>(() => {
    const contagem: Record<string, number | undefined> = {};
    for (const tarefa of this.tarefas()) {
      if (tarefa.status !== 'DONE') {
        contagem[tarefa.assigneeId] = (contagem[tarefa.assigneeId] ?? 0) + 1;
      }
    }
    return contagem;
  });

  protected readonly papeis: Role[] = ['ADMIN', 'MEMBER'];

  constructor() {
    effect(() => {
      const projeto = this.projeto();
      if (projeto) {
        this.carregar(projeto.id);
      }
    });
  }

  private carregar(projetoId: string): void {
    this.carregando.set(true);
    this.servicoDeMembros.listar(projetoId).subscribe({
      next: (membros) => {
        this.membros.set(membros);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
    if (this.ehAdmin()) {
      this.servicoDeMembros
        .listarConvites(projetoId)
        .subscribe((listaDeConvites) => this.convites.set(listaDeConvites));
    }
    const parametros = new HttpParams().set('size', 200);
    this.http
      .get<PageResponse<Task>>(`${API_BASE}/projects/${projetoId}/tasks`, { params: parametros })
      .subscribe((resposta) => this.tarefas.set(resposta.content));
  }

  protected ehDono(membro: ProjectMember): boolean {
    return membro.userId === this.projeto()?.ownerId;
  }
  protected ehVoce(membro: ProjectMember): boolean {
    return membro.userId === this.autenticacao.usuario()?.id;
  }

  protected mudarPapel(membro: ProjectMember, role: string): void {
    const projeto = this.projeto();
    if (!projeto || role === membro.role) {
      return;
    }
    this.servicoDeMembros.mudarPapel(projeto.id, membro.userId, role as Role).subscribe({
      next: (atualizado) => {
        this.membros.update((lista) =>
          lista.map((item) => (item.userId === membro.userId ? atualizado : item)),
        );
        this.notificacoes.sucesso('Papel atualizado.');
      },
    });
  }

  protected convidar(): void {
    const projeto = this.projeto();
    if (!projeto) {
      return;
    }
    this.dialog
      .open<Invitation | undefined>(InviteDialogComponent, {
        hasBackdrop: true,
        data: { projetoId: projeto.id },
      })
      .closed.subscribe((convite) => {
        if (convite) {
          this.convites.update((lista) => [convite, ...lista]);
        }
      });
  }

  protected revogar(convite: Invitation): void {
    const projeto = this.projeto();
    if (!projeto) {
      return;
    }
    this.dialog
      .open<boolean>(ConfirmDialogComponent, {
        hasBackdrop: true,
        data: {
          titulo: 'Revogar convite?',
          mensagem: `O link enviado para ${convite.email} deixa de funcionar.`,
          rotuloConfirmar: 'Revogar',
          perigo: true,
        },
      })
      .closed.subscribe((confirmado) => {
        if (confirmado) {
          this.servicoDeMembros.revogarConvite(projeto.id, convite.id).subscribe({
            next: () => {
              this.convites.update((lista) => lista.filter((item) => item.id !== convite.id));
              this.notificacoes.sucesso('Convite revogado.');
            },
          });
        }
      });
  }

  protected removerMembro(membro: ProjectMember): void {
    const projeto = this.projeto();
    if (!projeto) {
      return;
    }
    this.membroComMenuAberto.set(null);
    const tarefasAtivas = this.tarefas().filter(
      (tarefa) => tarefa.assigneeId === membro.userId && tarefa.status !== 'DONE',
    );
    const dados: RemoveMemberData = {
      projetoId: projeto.id,
      membro,
      tarefasAtivas,
      candidatos: this.membros().filter((outro) => outro.userId !== membro.userId),
    };
    this.dialog
      .open<boolean>(RemoveMemberDialogComponent, { hasBackdrop: true, data: dados })
      .closed.subscribe((removido) => {
        if (removido) {
          this.membros.update((lista) => lista.filter((item) => item.userId !== membro.userId));
          this.carregar(projeto.id);
          this.notificacoes.sucesso(`${membro.name} removido do projeto.`);
        }
      });
  }
}
