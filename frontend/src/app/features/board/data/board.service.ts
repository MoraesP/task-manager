import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { PageResponse, Task, TaskStatus, TASK_STATUSES } from '@shared/models';
import { API_BASE, SKIP_ERROR_TOAST } from '@core/http/api.config';
import { MembersService } from '@features/members/data/members.service';
import { ProjectMember } from '@shared/models';
import { TaskFilter } from '../models/task-filter.model';
import { TaskInput } from '../models/task-input.model';

const skipToast = () => new HttpContext().set(SKIP_ERROR_TOAST, true);
const BOARD_PAGE_SIZE = 100;

/**
 * Estado do quadro de um projeto. Fornecido pelo BoardPage, portanto recriado ao
 * trocar de projeto (docs/08-frontend.md).
 */
@Injectable()
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly membersService = inject(MembersService);

  private projectId = '';

  private readonly _tasks = signal<Task[]>([]);
  private readonly _members = signal<ProjectMember[]>([]);
  private readonly _loading = signal(true);
  private readonly _total = signal(0);
  private readonly _filter = signal<TaskFilter>({ sort: 'priority,desc' });

  readonly tasks = this._tasks.asReadonly();
  readonly members = this._members.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly total = this._total.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly truncated = computed(() => this._total() > this._tasks().length);
  readonly statuses = TASK_STATUSES;

  readonly columns = computed<Record<TaskStatus, Task[]>>(() => {
    const grouped = { TODO: [], IN_PROGRESS: [], DONE: [] } as Record<TaskStatus, Task[]>;
    for (const t of this._tasks()) {
      grouped[t.status].push(t);
    }
    return grouped;
  });

  init(projectId: string): void {
    this.projectId = projectId;
    this.membersService.list(projectId).subscribe((m) => this._members.set(m));
    this.reload();
  }

  setFilter(patch: Partial<TaskFilter>): void {
    this._filter.update((f) => ({ ...f, ...patch }));
    this.reload();
  }

  reload(): void {
    this._loading.set(true);
    let params = new HttpParams().set('page', 0).set('size', BOARD_PAGE_SIZE);
    const f = this._filter();
    if (f.status) {
      params = params.set('status', f.status);
    }
    if (f.priority) {
      params = params.set('priority', f.priority);
    }
    if (f.assigneeId) {
      params = params.set('assigneeId', f.assigneeId);
    }
    if (f.deadlineFrom) {
      params = params.set('deadlineFrom', f.deadlineFrom);
    }
    if (f.deadlineTo) {
      params = params.set('deadlineTo', f.deadlineTo);
    }
    if (f.sort) {
      params = params.set('sort', f.sort);
    }

    this.http
      .get<PageResponse<Task>>(`${API_BASE}/projects/${this.projectId}/tasks`, { params })
      .subscribe({
        next: (res) => {
          this._tasks.set(res.content);
          this._total.set(res.totalElements);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  search(term: string, page: number, size: number): Observable<PageResponse<Task>> {
    const params = new HttpParams().set('q', term).set('page', page).set('size', size);
    return this.http.get<PageResponse<Task>>(`${API_BASE}/projects/${this.projectId}/tasks/search`, {
      params,
    });
  }

  create(input: TaskInput): Observable<Task> {
    return this.http
      .post<Task>(`${API_BASE}/projects/${this.projectId}/tasks`, input)
      .pipe(tap((task) => this._tasks.update((list) => [task, ...list])));
  }

  update(taskId: string, input: TaskInput): Observable<Task> {
    return this.http
      .put<Task>(`${API_BASE}/projects/${this.projectId}/tasks/${taskId}`, input)
      .pipe(tap((task) => this.replace(task)));
  }

  changeStatus(taskId: string, status: TaskStatus): Observable<Task> {
    return this.http
      .patch<Task>(
        `${API_BASE}/projects/${this.projectId}/tasks/${taskId}/status`,
        { status },
        { context: skipToast() },
      )
      .pipe(tap((task) => this.replace(task)));
  }

  remove(taskId: string): Observable<void> {
    return this.http
      .delete<void>(`${API_BASE}/projects/${this.projectId}/tasks/${taskId}`)
      .pipe(tap(() => this._tasks.update((list) => list.filter((t) => t.id !== taskId))));
  }

  /** Move otimista de um card entre colunas (revertido pelo componente em caso de erro). */
  moveOptimistic(taskId: string, to: TaskStatus): void {
    this._tasks.update((list) => list.map((t) => (t.id === taskId ? { ...t, status: to } : t)));
  }

  private replace(task: Task): void {
    this._tasks.update((list) => list.map((t) => (t.id === task.id ? task : t)));
  }
}
