import { PrismaClient } from '@/generated/prisma/client';
import { IOtpRepository, OtpData } from '../../applications/ports';

/**
 * Prisma implementation of OTP Repository
 */
export class PrismaOtpRepository implements IOtpRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(data: OtpData): Promise<void> {
    await this.prisma.otp.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        otp: data.otp,
        passwordHash: data.password || null,
        expiresAt: data.expiresAt,
        attempts: data.attempts,
      },
      update: {
        otp: data.otp,
        passwordHash: data.password || null,
        expiresAt: data.expiresAt,
        attempts: data.attempts,
      },
    });
  }

  async findByEmail(email: string): Promise<OtpData | null> {
    const record = await this.prisma.otp.findUnique({
      where: { email },
    });

    if (!record) {
      return null;
    }

    return {
      email: record.email,
      otp: record.otp,
      password: record.passwordHash ?? '',
      expiresAt: record.expiresAt,
      attempts: record.attempts,
    };
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.prisma.otp.deleteMany({
      where: { email },
    });
  }

  async incrementAttempts(email: string): Promise<void> {
    await this.prisma.otp.updateMany({
      where: { email },
      data: {
        attempts: { increment: 1 },
      },
    });
  }
}
