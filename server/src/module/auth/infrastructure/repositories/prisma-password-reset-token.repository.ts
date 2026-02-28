import { PrismaClient } from '@/generated/prisma/client';
import { PasswordResetToken, IPasswordResetTokenRepository } from '../../applications/ports/output';

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(token: PasswordResetToken): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: {
        id: token.id || undefined,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const token = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!token) return null;

    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.prisma.passwordResetToken.delete({
      where: { tokenHash },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  }
}
