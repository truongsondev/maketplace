import { PrismaClient } from '@/generated/prisma/client';
import type { UserAddressResult } from '../../applications/dto';
import type { IUserAddressRepository } from '../../applications/ports/output';

export class PrismaAddressRepository implements IUserAddressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<UserAddressResult[]> {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        recipient: true,
        phone: true,
        addressLine: true,
        ward: true,
        district: true,
        city: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return addresses;
  }
}
