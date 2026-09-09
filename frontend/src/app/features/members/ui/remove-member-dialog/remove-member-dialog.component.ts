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
  projetoId: string;
  membro: ProjectMember;
  tarefasAtivas: Task[];
  candidatos: ProjectMember[];
}

@Component({
  selector: 'app-remove-member-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, SpinnerComponent, StatusPillComponent],
  templateUrl: './remove-member-dialog.component.html',
  styleUrl: './remove-member-dialog.component.scss',
})
export class RemoveMemberDialogComponent {
  private readonly servicoDeMembros = inject(MembersService);

  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly dados = inject<RemoveMemberData>(DIALOG_DATA);

  protected readonly carregando = signal(false);
  protected readonly escolhas = signal<Record<string, string | undefined>>({});

  protected readonly todasAtribuidas = computed(() =>
    this.dados.tarefasAtivas.every((tarefa) => !!this.escolhas()[tarefa.id]),
  );

  protected idCurto(id: string): string {
    return 'T-' + id.slice(0, 4).toUpperCase();
  }

  protected definirEscolha(tarefaId: string, usuarioId: string): void {
    this.escolhas.update((atual) => ({ ...atual, [tarefaId]: usuarioId }));
  }

  protected enviar(): void {
    if (this.carregando() || (this.dados.tarefasAtivas.length > 0 && !this.todasAtribuidas())) {
      return;
    }
    this.carregando.set(true);
    const reassignments: Reassignment[] = this.dados.tarefasAtivas.map((tarefa) => ({
      taskId: tarefa.id,
      newAssigneeId: this.escolhas()[tarefa.id]!,
    }));
    this.servicoDeMembros
      .remover(this.dados.projetoId, this.dados.membro.userId, reassignments)
      .subscribe({
        next: () => this.ref.close(true),
        error: () => this.carregando.set(false),
      });
  }
}
