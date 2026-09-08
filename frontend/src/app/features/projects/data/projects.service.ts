import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { PageResponse, Project } from '@shared/models';
import { API_BASE } from '@core/http/api.config';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);

  private readonly _current = signal<Project | null>(null);
  private readonly _mine = signal<Project[]>([]);

  /** Projeto aberto no momento (para a sidebar e breadcrumbs). */
  readonly current = this._current.asReadonly();
  /** Cache leve da lista de projetos do usuário. */
  readonly mine = this._mine.asReadonly();

  page(page: number, size = 12): Observable<PageResponse<Project>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'updatedAt,desc');
    return this.http
      .get<PageResponse<Project>>(`${API_BASE}/projects`, { params })
      .pipe(tap((res) => this._mine.set(res.content)));
  }

  load(id: string): Observable<Project> {
    if (this._current()?.id === id) {
      return of(this._current()!);
    }
    return this.http.get<Project>(`${API_BASE}/projects/${id}`).pipe(tap((p) => this._current.set(p)));
  }

  refreshCurrent(id: string): Observable<Project> {
    return this.http.get<Project>(`${API_BASE}/projects/${id}`).pipe(tap((p) => this._current.set(p)));
  }

  create(name: string, description: string): Observable<Project> {
    return this.http.post<Project>(`${API_BASE}/projects`, {
      name,
      description: description || null,
    });
  }

  update(id: string, name: string, description: string): Observable<Project> {
    return this.http
      .put<Project>(`${API_BASE}/projects/${id}`, { name, description: description || null })
      .pipe(tap((p) => this._current.set(p)));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/projects/${id}`).pipe(
      tap(() => {
        if (this._current()?.id === id) {
          this._current.set(null);
        }
        this._mine.update((list) => list.filter((p) => p.id !== id));
      }),
    );
  }

  clearCurrent(): void {
    this._current.set(null);
  }
}
