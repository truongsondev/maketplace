import { PrismaClient } from '@/generated/prisma/client';
import { UserStatus } from '../../../../auth/entities/user/user.entity';
import { AdminAuthUser, IAdminUserRepository } from '../../applications/ports/output';

export class PrismaAdminUserRepository implements IAdminUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmailWithRoles(email: string): Promise<AdminAuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
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
      fullName: user.profile?.fullName ?? undefined,
      avatarUrl: user.profile?.avatarUrl ?? undefined,
      roleCodes: user.userRoles.map((userRole) => userRole.role.code),
    };
  }
}
