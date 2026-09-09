import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatedInvitation, Invitation, ProjectMember, Role } from '@shared/models';
import { API_BASE } from '@core/http/api.config';
import { Reassignment } from '../models/reassignment.model';

@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly http = inject(HttpClient);

  listar(projetoId: string): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`${API_BASE}/projects/${projetoId}/members`);
  }

  mudarPapel(projetoId: string, usuarioId: string, role: Role): Observable<ProjectMember> {
    return this.http.patch<ProjectMember>(
      `${API_BASE}/projects/${projetoId}/members/${usuarioId}`,
      { role },
    );
  }

  remover(
    projetoId: string,
    usuarioId: string,
    reassignments: Reassignment[],
  ): Observable<void> {
    return this.http.request<void>(
      'delete',
      `${API_BASE}/projects/${projetoId}/members/${usuarioId}`,
      { body: { reassignments } },
    );
  }

  listarConvites(projetoId: string): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(`${API_BASE}/projects/${projetoId}/invitations`);
  }

  convidar(projetoId: string, email: string, role: Role): Observable<CreatedInvitation> {
    return this.http.post<CreatedInvitation>(`${API_BASE}/projects/${projetoId}/invitations`, {
      email,
      role,
    });
  }

  revogarConvite(projetoId: string, conviteId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/projects/${projetoId}/invitations/${conviteId}`);
  }
}
