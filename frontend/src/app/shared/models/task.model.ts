import { TaskPriority, TaskStatus } from './enums';

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
