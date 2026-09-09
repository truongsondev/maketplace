import { PrismaClient } from '@/generated/prisma/client';
import type { UserAddressResult } from '../../applications/dto';
import type { IUserAddressRepository } from '../../applications/ports/output';

export class PrismaAddressRepository implements IUserAddressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(userId: string, id: string): Promise<UserAddressResult | null> {
    const address = await this.prisma.userAddress.findFirst({
      where: { userId, id },
      select: {
        id: true,
        recipient: true,
        phone: true,
        addressLine: true,
        ward: true,
        district: true,
        city: true,
        ghnProvinceId: true,
        ghnDistrictId: true,
        ghnWardCode: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return address;
  }

  async findDefaultOrLatestByUserId(userId: string): Promise<UserAddressResult | null> {
    const address = await this.prisma.userAddress.findFirst({
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
        ghnProvinceId: true,
        ghnDistrictId: true,
        ghnWardCode: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return address;
  }

  async findMatchingByUserId(
    userId: string,
    input: {
      recipient: string;
      phone: string;
      addressLine: string;
      ward: string;
      district: string;
      city: string;
      ghnProvinceId?: number;
      ghnDistrictId?: number;
      ghnWardCode?: string;
    },
  ): Promise<UserAddressResult | null> {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        userId,
        recipient: input.recipient,
        phone: input.phone,
        addressLine: input.addressLine,
        ward: input.ward,
        district: input.district,
        city: input.city,
        ghnProvinceId: input.ghnProvinceId ?? null,
        ghnDistrictId: input.ghnDistrictId ?? null,
        ghnWardCode: input.ghnWardCode ?? null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        recipient: true,
        phone: true,
        addressLine: true,
        ward: true,
        district: true,
        city: true,
        ghnProvinceId: true,
        ghnDistrictId: true,
        ghnWardCode: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return address;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.userAddress.count({ where: { userId } });
  }

  async createForUser(
    userId: string,
    input: {
      recipient: string;
      phone: string;
      addressLine: string;
      ward: string;
      district: string;
      city: string;
      ghnProvinceId?: number;
      ghnDistrictId?: number;
      ghnWardCode?: string;
      isDefault: boolean;
    },
  ): Promise<UserAddressResult> {
    const created = await this.prisma.userAddress.create({
      data: {
        userId,
        recipient: input.recipient,
        phone: input.phone,
        addressLine: input.addressLine,
        ward: input.ward,
        district: input.district,
        city: input.city,
        ghnProvinceId: input.ghnProvinceId,
        ghnDistrictId: input.ghnDistrictId,
        ghnWardCode: input.ghnWardCode,
        isDefault: input.isDefault,
      },
      select: {
        id: true,
        recipient: true,
        phone: true,
        addressLine: true,
        ward: true,
        district: true,
        city: true,
        ghnProvinceId: true,
        ghnDistrictId: true,
        ghnWardCode: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return created;
  }

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
        ghnProvinceId: true,
        ghnDistrictId: true,
        ghnWardCode: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return addresses;
  }
}
