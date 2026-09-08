export type Role = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export const TASK_STATUSES: readonly TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
export const TASK_PRIORITIES: readonly TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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
export const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['TODO', 'DONE'],
  DONE: ['IN_PROGRESS'],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}
