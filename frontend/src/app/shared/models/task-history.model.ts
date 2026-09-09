/** Tipos de alteração registrados no histórico da tarefa (audit log). */
export type TaskChangeType =
  | 'ALTERACAO_TITULO'
  | 'ALTERACAO_DESCRICAO'
  | 'ALTERACAO_PRIORIDADE'
  | 'ALTERACAO_PRAZO'
  | 'ALTERACAO_RESPONSAVEL'
  | 'ALTERACAO_STATUS';

export interface UserRef {
  id: string;
  name: string;
}

export interface TaskChange {
  occurredAt: string;
  author: UserRef;
  type: TaskChangeType;
  /** Valor "de wire": nome do enum, ISO da data, texto — ou já o nome do responsável. */
  oldValue: string | null;
  newValue: string | null;
}

export interface TaskHistory {
  createdAt: string;
  createdBy: UserRef | null;
  changes: TaskChange[];
}

/** Rótulo do campo alterado, para o cabeçalho de cada item do histórico. */
export const TASK_CHANGE_LABEL: Record<TaskChangeType, string> = {
  ALTERACAO_TITULO: 'Título',
  ALTERACAO_DESCRICAO: 'Descrição',
  ALTERACAO_PRIORIDADE: 'Prioridade',
  ALTERACAO_PRAZO: 'Prazo',
  ALTERACAO_RESPONSAVEL: 'Responsável',
  ALTERACAO_STATUS: 'Status',
};
