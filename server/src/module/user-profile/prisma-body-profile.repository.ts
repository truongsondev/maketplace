import type { PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../error-handlling/badRequestError';
import { toBodyProfileResult, type BodyProfileResult, type UpdateBodyProfileCommand } from './body-profile.types';

export class PrismaBodyProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByUserId(userId: string): Promise<BodyProfileResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        age: true,
        birthday: true,
        heightCm: true,
        weightKg: true,
        bodyProfileUpdatedAt: true,
      },
    });

    if (!user) {
      return {
        age: null,
        birthday: null,
        heightCm: null,
        weightKg: null,
        isComplete: false,
        updatedAt: null,
      };
    }

    return toBodyProfileResult(user);
  }

  async update(command: UpdateBodyProfileCommand): Promise<BodyProfileResult> {
    if (command.birthday !== undefined) {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: command.userId },
        select: { birthday: true },
      });

      if (existingUser?.birthday) {
        throw new BadRequestError(
          'Ngày sinh đã được lưu và không thể cập nhật lại.',
          'BIRTHDAY_ALREADY_SET',
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id: command.userId },
      data: {
        ...(command.age !== undefined ? { age: command.age } : {}),
        ...(command.birthday !== undefined ? { birthday: command.birthday } : {}),
        ...(command.heightCm !== undefined ? { heightCm: command.heightCm } : {}),
        ...(command.weightKg !== undefined ? { weightKg: command.weightKg } : {}),
        bodyProfileUpdatedAt: new Date(),
      },
      select: {
        age: true,
        birthday: true,
        heightCm: true,
        weightKg: true,
        bodyProfileUpdatedAt: true,
      },
    });

    return toBodyProfileResult(user);
  }
}
