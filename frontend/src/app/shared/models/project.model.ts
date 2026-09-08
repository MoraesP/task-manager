import { Role } from './enums';

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
