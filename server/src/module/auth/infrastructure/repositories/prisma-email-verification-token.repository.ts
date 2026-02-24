import { PrismaClient } from '@/generated/prisma/client';
import {
  EmailVerificationToken,
  IEmailVerificationTokenRepository,
} from '../../applications/ports/output';

export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(token: EmailVerificationToken): Promise<void> {
    await this.prisma.emailVerificationToken.create({
      data: {
        id: token.id || undefined, // Let Prisma generate ID if empty
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!token) {
      return null;
    }

    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.prisma.emailVerificationToken.delete({
      where: { tokenHash },
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}