import { Dialog } from '@angular/cdk/dialog';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
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
  host: { '(document:click)': 'menuFor.set(null)' },
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
  private readonly service = inject(MembersService);
  private readonly projects = inject(ProjectsService);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);

  protected readonly project = this.projects.current;
  protected readonly isAdmin = computed(() => this.project()?.role === 'ADMIN');
  protected readonly tab = signal<'members' | 'invitations'>('members');

  protected readonly loading = signal(true);
  protected readonly members = signal<ProjectMember[]>([]);
  protected readonly invitations = signal<Invitation[]>([]);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly menuFor = signal<string | null>(null);

  protected readonly activeByAssignee = computed<Record<string, number | undefined>>(() => {
    const map: Record<string, number | undefined> = {};
    for (const t of this.tasks()) {
      if (t.status !== 'DONE') {
        map[t.assigneeId] = (map[t.assigneeId] ?? 0) + 1;
      }
    }
    return map;
  });

  protected readonly roles: Role[] = ['ADMIN', 'MEMBER'];

  constructor() {
    effect(() => {
      const p = this.project();
      if (p) {
        this.load(p.id);
      }
    });
  }

  private load(projectId: string): void {
    this.loading.set(true);
    this.service.list(projectId).subscribe({
      next: (m) => {
        this.members.set(m);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    if (this.isAdmin()) {
      this.service.listInvitations(projectId).subscribe((i) => this.invitations.set(i));
    }
    const params = new HttpParams().set('size', 200);
    this.http
      .get<PageResponse<Task>>(`${API_BASE}/projects/${projectId}/tasks`, { params })
      .subscribe((res) => this.tasks.set(res.content));
  }

  protected isOwner(m: ProjectMember): boolean {
    return m.userId === this.project()?.ownerId;
  }
  protected isYou(m: ProjectMember): boolean {
    return m.userId === this.auth.user()?.id;
  }

  protected changeRole(m: ProjectMember, role: string): void {
    const p = this.project();
    if (!p || role === m.role) {
      return;
    }
    this.service.changeRole(p.id, m.userId, role as Role).subscribe({
      next: (updated) => {
        this.members.update((list) => list.map((x) => (x.userId === m.userId ? updated : x)));
        this.toast.success('Papel atualizado.');
      },
    });
  }

  protected invite(): void {
    const p = this.project();
    if (!p) {
      return;
    }
    this.dialog
      .open<Invitation | undefined>(InviteDialogComponent, {
        hasBackdrop: true,
        data: { projectId: p.id },
      })
      .closed.subscribe((inv) => {
        if (inv) {
          this.invitations.update((list) => [inv, ...list]);
        }
      });
  }

  protected revoke(inv: Invitation): void {
    const p = this.project();
    if (!p) {
      return;
    }
    this.dialog
      .open<boolean>(ConfirmDialogComponent, {
        hasBackdrop: true,
        data: {
          title: 'Revogar convite?',
          message: `O link enviado para ${inv.email} deixa de funcionar.`,
          confirmLabel: 'Revogar',
          danger: true,
        },
      })
      .closed.subscribe((ok) => {
        if (ok) {
          this.service.revokeInvitation(p.id, inv.id).subscribe({
            next: () => {
              this.invitations.update((list) => list.filter((i) => i.id !== inv.id));
              this.toast.success('Convite revogado.');
            },
          });
        }
      });
  }

  protected removeMember(m: ProjectMember): void {
    const p = this.project();
    if (!p) {
      return;
    }
    this.menuFor.set(null);
    const active = this.tasks().filter((t) => t.assigneeId === m.userId && t.status !== 'DONE');
    const data: RemoveMemberData = {
      projectId: p.id,
      member: m,
      activeTasks: active,
      candidates: this.members().filter((x) => x.userId !== m.userId),
    };
    this.dialog
      .open<boolean>(RemoveMemberDialogComponent, { hasBackdrop: true, data })
      .closed.subscribe((done) => {
        if (done) {
          this.members.update((list) => list.filter((x) => x.userId !== m.userId));
          this.load(p.id);
          this.toast.success(`${m.name} removido do projeto.`);
        }
      });
  }
}
