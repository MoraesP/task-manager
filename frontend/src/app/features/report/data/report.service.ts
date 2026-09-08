import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectReport } from '@shared/models';
import { API_BASE } from '@core/http/api.config';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  forProject(projectId: string): Observable<ProjectReport> {
    return this.http.get<ProjectReport>(`${API_BASE}/projects/${projectId}/report`);
  }
}
