import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { PageResponse, Project } from '@shared/models';
import { API_BASE } from '@core/http/api.config';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);

  private readonly _projetoAtual = signal<Project | null>(null);
  private readonly _meusProjetos = signal<Project[]>([]);

  /** Projeto aberto no momento (para a sidebar e breadcrumbs). */
  readonly projetoAtual = this._projetoAtual.asReadonly();
  /** Cache leve da lista de projetos do usuário. */
  readonly meusProjetos = this._meusProjetos.asReadonly();

  pagina(pagina: number, tamanho = 12): Observable<PageResponse<Project>> {
    const parametros = new HttpParams()
      .set('page', pagina)
      .set('size', tamanho)
      .set('sort', 'updatedAt,desc');
    return this.http
      .get<PageResponse<Project>>(`${API_BASE}/projects`, { params: parametros })
      .pipe(tap((resposta) => this._meusProjetos.set(resposta.content)));
  }

  carregar(id: string): Observable<Project> {
    if (this._projetoAtual()?.id === id) {
      return of(this._projetoAtual()!);
    }
    return this.http
      .get<Project>(`${API_BASE}/projects/${id}`)
      .pipe(tap((projeto) => this._projetoAtual.set(projeto)));
  }

  recarregarAtual(id: string): Observable<Project> {
    return this.http
      .get<Project>(`${API_BASE}/projects/${id}`)
      .pipe(tap((projeto) => this._projetoAtual.set(projeto)));
  }

  criar(name: string, description: string): Observable<Project> {
    return this.http.post<Project>(`${API_BASE}/projects`, {
      name,
      description: description || null,
    });
  }

  atualizar(id: string, name: string, description: string): Observable<Project> {
    return this.http
      .put<Project>(`${API_BASE}/projects/${id}`, { name, description: description || null })
      .pipe(tap((projeto) => this._projetoAtual.set(projeto)));
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/projects/${id}`).pipe(
      tap(() => {
        if (this._projetoAtual()?.id === id) {
          this._projetoAtual.set(null);
        }
        this._meusProjetos.update((lista) => lista.filter((projeto) => projeto.id !== id));
      }),
    );
  }

  limparAtual(): void {
    this._projetoAtual.set(null);
  }
}
