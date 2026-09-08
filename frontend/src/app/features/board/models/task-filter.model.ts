import { TaskPriority, TaskStatus } from '@shared/models';

export interface TaskFilter {
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  assigneeId?: string | null;
  deadlineFrom?: string | null;
  deadlineTo?: string | null;
  /** ex.: "priority,desc" */
  sort?: string;
}
