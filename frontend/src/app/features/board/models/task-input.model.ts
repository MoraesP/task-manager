export interface TaskInput {
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  assigneeId: string;
}
