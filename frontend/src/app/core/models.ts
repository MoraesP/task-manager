/** Tipos que espelham o contrato da API (docs/06-api-endpoints.md). */

export type Role = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: Role;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface Invitation {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  expiresAt: string;
}

export interface CreatedInvitation {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  assigneeName: string;
  deadline: string | null;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectReport {
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** RFC 7807 — resposta de erro da API. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: { field: string; message: string }[];
  tasksInProgress?: string[];
  [key: string]: unknown;
}

// ---- ordenação e filtros do quadro ----

export type TaskSortKey = 'priority' | 'createdAt' | 'deadline';

export interface TaskFilter {
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  assigneeId?: string | null;
  deadlineFrom?: string | null;
  deadlineTo?: string | null;
  sort?: string; // ex.: "priority,desc"
}

export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em progresso',
  DONE: 'Concluído',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Membro',
};

/** Transições permitidas da máquina de estados (RN-01..03). */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['TODO', 'DONE'],
  DONE: ['IN_PROGRESS'],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}
