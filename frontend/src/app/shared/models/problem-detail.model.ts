/** RFC 7807 — corpo de erro da API. */
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
