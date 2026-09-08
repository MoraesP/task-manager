export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
