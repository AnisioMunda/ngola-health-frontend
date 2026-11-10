import { Role } from './roles';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roles: Role[];
  /** Null para o administrador da plataforma. */
  hospitalId: string | null;
  hospitalName: string | null;
  mustChangePassword: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Segundos até o token de acesso expirar. */
  expiresIn: number;
  user: AuthUser;
}
