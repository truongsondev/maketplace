import { UserStatus } from '../../../../../auth/entities/user/user.entity';

export interface AdminAuthUser {
  id: string;
  email: string | null;
  passwordHash: string | null;
  emailVerified: boolean;
  status: UserStatus;
  fullName?: string;
  avatarUrl?: string;
  roleCodes: string[];
}

export interface IAdminUserRepository {
  findByEmailWithRoles(email: string): Promise<AdminAuthUser | null>;
  updateLastLogin(userId: string): Promise<void>;
}
