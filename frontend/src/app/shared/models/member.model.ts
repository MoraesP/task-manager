import { Role } from './enums';

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: Role;
}
