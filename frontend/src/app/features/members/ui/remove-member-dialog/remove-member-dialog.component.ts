import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectMember, Task } from '@shared/models';
import { StatusPillComponent } from '@shared/components/status-pill/status-pill.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { MembersService } from '../../data/members.service';
import { Reassignment } from '../../models/reassignment.model';

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
  templateUrl: './remove-member-dialog.component.html',
  styleUrl: './remove-member-dialog.component.scss',
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

  protected shortId(id: string): string {
    return 'T-' + id.slice(0, 4).toUpperCase();
  }

  protected setPick(taskId: string, userId: string): void {
    this.picks.update((p) => ({ ...p, [taskId]: userId }));
  }

  protected submit(): void {
    if (this.loading() || (this.data.activeTasks.length > 0 && !this.allAssigned())) {
      return;
    }
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
