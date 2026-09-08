import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  PageResponse,
  STATUS_LABEL,
  Task,
  TaskFilter,
  TaskStatus,
  canTransition,
} from '../core/models';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/problem-detail';
import { ToastService } from '../core/toast.service';
import { ProjectsService } from '../projects/projects.service';
import { PaginatorComponent } from '../shared/paginator';
import { EmptyStateComponent, PageLoaderComponent } from '../shared/ui';
import { TopbarComponent } from '../shell/topbar';
import { RoleBadgeComponent } from '../shared/badges';
import { BoardService } from './board.service';
import { BoardToolbarComponent } from './board-toolbar';
import { TaskCardComponent } from './task-card';
import { TaskDrawerComponent, TaskDrawerData } from './task-drawer';

@Component({
  selector: 'app-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BoardService],
  imports: [
    CdkDropList,
    CdkDrag,
    TopbarComponent,
    BoardToolbarComponent,
    TaskCardComponent,
    PaginatorComponent,
    EmptyStateComponent,
    PageLoaderComponent,
    RoleBadgeComponent,
  ],
  templateUrl: './board-page.html',
  styleUrl: './board-page.scss',
})
export class BoardPageComponent {
  protected readonly board = inject(BoardService);
  private readonly projects = inject(ProjectsService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly project = this.projects.current;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly columnIds = ['col-TODO', 'col-IN_PROGRESS', 'col-DONE'];

  protected readonly openMenuId = signal<string | null>(null);

  // busca
  protected readonly searchTerm = signal('');
  protected readonly searching = signal(false);
  protected readonly searchPage = signal(0);
  protected readonly searchResult = signal<PageResponse<Task> | null>(null);

  protected readonly showBoard = computed(() => this.searchTerm().length === 0);

  constructor() {
    const id = this.project()?.id;
    if (id) this.board.init(id);
  }

  protected onFilter(patch: Partial<TaskFilter>): void {
    this.board.setFilter(patch);
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    if (term.length >= 2) {
      this.runSearch(0);
    } else {
      this.searchResult.set(null);
    }
  }

  protected runSearch(page: number): void {
    this.searching.set(true);
    this.searchPage.set(page);
    this.board.search(this.searchTerm(), page, 20).subscribe({
      next: (res) => {
        this.searchResult.set(res);
        this.searching.set(false);
      },
      error: () => this.searching.set(false),
    });
  }

  // ---- drag & drop ----
  protected drop(event: CdkDragDrop<Task[]>, to: TaskStatus): void {
    if (event.previousContainer === event.container) return;
    this.applyStatusChange(event.item.data as Task, to);
  }

  protected menuMove(task: Task, to: TaskStatus): void {
    this.applyStatusChange(task, to);
  }

  private applyStatusChange(task: Task, to: TaskStatus): void {
    if (task.status === to) return;
    if (!canTransition(task.status, to)) {
      this.toast.error(
        `Transição inválida: “${STATUS_LABEL[task.status]}” não vai direto para “${STATUS_LABEL[to]}”.`,
      );
      return;
    }
    const from = task.status;
    this.board.moveOptimistic(task.id, to);
    this.board.changeStatus(task.id, to).subscribe({
      error: (err) => {
        this.board.moveOptimistic(task.id, from);
        this.toast.error(errorMessage(err));
      },
    });
  }

  protected removeTask(task: Task): void {
    this.board.remove(task.id).subscribe({
      next: () => this.toast.success('Tarefa excluída.'),
    });
  }

  protected newTask(): void {
    this.openDrawer(null);
  }

  protected editTask(task: Task): void {
    this.openDrawer(task);
  }

  private openDrawer(task: Task | null): void {
    const data: TaskDrawerData = { task, members: this.board.members() };
    const wasMine = task?.assigneeId === this.auth.user()?.id;
    this.dialog
      .open<Task | undefined>(TaskDrawerComponent, {
        data,
        panelClass: 'drawer-pane',
        hasBackdrop: true,
        providers: [{ provide: BoardService, useValue: this.board }],
      })
      .closed.subscribe((saved) => {
        if (saved && !wasMine && saved.assigneeId === this.auth.user()?.id) {
          this.toast.success(`Tarefa atribuída a você: “${saved.title}”.`);
        }
      });
  }
}
