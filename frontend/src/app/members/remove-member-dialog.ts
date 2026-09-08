import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectMember, Task } from '../core/models';
import { StatusPillComponent } from '../shared/badges';
import { IconComponent } from '../shared/icon';
import { SpinnerComponent } from '../shared/ui';
import { MembersService, Reassignment } from './members.service';

export interface RemoveMemberData {
  projectId: string;
  member: ProjectMember;
  activeTasks: Task[];
  candidates: ProjectMember[];
}

@Component({
  selector: 'app-remove-member-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, SpinnerComponent, StatusPillComponent],
  templateUrl: './remove-member-dialog.html',
  styles: `
    .task-line { display: flex; align-items: flex-start; gap: 12px; }
    .task-line .info { flex: 1; }
    .task-line .info .t { font-weight: 600; font-size: 12.5px; }
    .task-line .info .m { font-size: 11.5px; color: var(--text-3); display: flex; align-items: center; gap: 6px; margin-top: 2px; }
    .task-line select { width: 200px; }
  `,
})
export class RemoveMemberDialogComponent {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<RemoveMemberData>(DIALOG_DATA);
  private readonly service = inject(MembersService);

  protected readonly loading = signal(false);
  protected readonly picks = signal<Record<string, string | undefined>>({});

  protected readonly allAssigned = computed(() =>
    this.data.activeTasks.every((t) => !!this.picks()[t.id]),
  );

  protected setPick(taskId: string, userId: string): void {
    this.picks.update((p) => ({ ...p, [taskId]: userId }));
  }

  protected submit(): void {
    if (this.loading() || (this.data.activeTasks.length > 0 && !this.allAssigned())) return;
    this.loading.set(true);
    const reassignments: Reassignment[] = this.data.activeTasks.map((t) => ({
      taskId: t.id,
      newAssigneeId: this.picks()[t.id]!,
    }));
    this.service.remove(this.data.projectId, this.data.member.userId, reassignments).subscribe({
      next: () => this.ref.close(true),
      error: () => this.loading.set(false),
    });
  }
}
