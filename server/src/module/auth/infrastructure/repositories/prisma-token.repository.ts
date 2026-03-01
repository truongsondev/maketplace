import { PrismaClient } from '@/generated/prisma/client';
import { ITokenRepository } from '../../applications/ports/output/token.repository';

export class PrismaTokenRepository implements ITokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Lưu refresh token mới cho user.
   * Nếu deviceInfo được cung cấp, thu hồi token cũ của thiết bị đó trước khi tạo mới
   * để tránh tích lũy token thừa và đảm bảo mỗi thiết bị chỉ có một phiên active.
   */
  async saveToken(userId: string, hashedToken: string, deviceInfo?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (deviceInfo) {
        await tx.refreshToken.updateMany({
          where: { userId, deviceInfo, revoked: false },
          data: { revoked: true },
        });
      }

      await tx.refreshToken.create({
        data: {
          userId,
          token: hashedToken,
          deviceInfo: deviceInfo ?? null,
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ngày
        },
      });
    });
  }

  /**
   * Thu hồi tất cả token active của một thiết bị cụ thể (dùng cho logout theo thiết bị).
   */
  async revokeTokensByDevice(userId: string, deviceInfo: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, deviceInfo, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Thu hồi một refresh token cụ thể theo hash (dùng khi logout).
   */
  async revokeTokenByHash(hashedToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: hashedToken, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Thu hồi toàn bộ refresh token của user (logout khỏi tất cả thiết bị).
   */
  async revokeAllTokensByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Tìm token mới nhất của user (backward compat).
   */
  async findTokenByUserId(userId: string): Promise<string | null> {
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { userId, revoked: false },
      orderBy: { createdAt: 'desc' },
    });
    return tokenRecord ? tokenRecord.token : null;
  }
}
