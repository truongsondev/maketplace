import {
  PrismaClient,
  User as PrismaUser,
  UserStatus as PrismaUserStatus,
} from '@/generated/prisma/client';
import { IUserRepository } from '../../applications/ports/output/user.repository';
import { User, UserStatus } from '../../entities/user/user.entity';
import { Email } from '../../entities/value-object/email.vo';
import { ITokenRepository } from '../../applications/ports/output/token.repository';

export class PrismaTokenRepository implements ITokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveToken(userId: string, hashedToken: string): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async findTokenByUserId(userId: string): Promise<string | null> {
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return tokenRecord ? tokenRecord.token : null;
  }
}
