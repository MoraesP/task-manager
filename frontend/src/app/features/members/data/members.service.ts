import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatedInvitation, Invitation, ProjectMember, Role } from '@shared/models';
import { API_BASE } from '@core/http/api.config';
import { Reassignment } from '../models/reassignment.model';

@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly http = inject(HttpClient);

  list(projectId: string): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`${API_BASE}/projects/${projectId}/members`);
  }

  changeRole(projectId: string, userId: string, role: Role): Observable<ProjectMember> {
    return this.http.patch<ProjectMember>(`${API_BASE}/projects/${projectId}/members/${userId}`, {
      role,
    });
  }

  remove(projectId: string, userId: string, reassignments: Reassignment[]): Observable<void> {
    return this.http.request<void>('delete', `${API_BASE}/projects/${projectId}/members/${userId}`, {
      body: { reassignments },
    });
  }

  listInvitations(projectId: string): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(`${API_BASE}/projects/${projectId}/invitations`);
  }

  invite(projectId: string, email: string, role: Role): Observable<CreatedInvitation> {
    return this.http.post<CreatedInvitation>(`${API_BASE}/projects/${projectId}/invitations`, {
      email,
      role,
    });
  }

  revokeInvitation(projectId: string, invitationId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/projects/${projectId}/invitations/${invitationId}`);
  }
}
