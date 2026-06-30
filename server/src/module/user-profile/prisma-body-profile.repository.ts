import type { PrismaClient } from '@/generated/prisma/client';
import { toBodyProfileResult, type BodyProfileResult, type UpdateBodyProfileCommand } from './body-profile.types';

export class PrismaBodyProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByUserId(userId: string): Promise<BodyProfileResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        age: true,
        heightCm: true,
        weightKg: true,
        bodyProfileUpdatedAt: true,
      },
    });

    if (!user) {
      return {
        age: null,
        heightCm: null,
        weightKg: null,
        isComplete: false,
        updatedAt: null,
      };
    }

    return toBodyProfileResult(user);
  }

  async update(command: UpdateBodyProfileCommand): Promise<BodyProfileResult> {
    const user = await this.prisma.user.update({
      where: { id: command.userId },
      data: {
        age: command.age,
        heightCm: command.heightCm,
        weightKg: command.weightKg,
        bodyProfileUpdatedAt: new Date(),
      },
      select: {
        age: true,
        heightCm: true,
        weightKg: true,
        bodyProfileUpdatedAt: true,
      },
    });

    return toBodyProfileResult(user);
  }
}
