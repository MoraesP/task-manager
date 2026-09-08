import { TaskPriority, TaskStatus } from './enums';

export interface ProjectReport {
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
}
