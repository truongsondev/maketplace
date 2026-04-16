import { PrismaClient } from '@/generated/prisma/client';
import { UserStatus } from '../../../../auth/entities/user/user.entity';
import { AdminAuthUser, IAdminUserRepository } from '../../applications/ports/output';

export class PrismaAdminUserRepository implements IAdminUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmailWithRoles(email: string): Promise<AdminAuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      emailVerified: user.emailVerified,
      status: user.status as UserStatus,
      roleCodes: user.userRoles.map((userRole) => userRole.role.code),
    };
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }
}
