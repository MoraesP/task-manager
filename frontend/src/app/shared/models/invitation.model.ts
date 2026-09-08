import { InvitationStatus, Role } from './enums';

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
