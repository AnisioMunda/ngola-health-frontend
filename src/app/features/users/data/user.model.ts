import { Role } from '../../../core/auth/roles';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  professionalCardNumber: string | null;
  roles: Role[];
  hospitalId: string | null;
  hospitalName: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface UserProfileFields {
  fullName: string;
  email: string;
  phone: string | null;
  specialty: string | null;
  professionalCardNumber: string | null;
  roles: Role[];
  hospitalId: string | null;
}

export interface CreateUserRequest extends UserProfileFields {
  username: string;
  temporaryPassword: string;
}

export interface UpdateUserRequest extends UserProfileFields {
  version: number | null;
}

export interface UserSearch {
  search?: string;
  role?: Role;
  status?: UserStatus;
  hospitalId?: string;
  page?: number;
  size?: number;
}
