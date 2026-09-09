import type { PrismaClient } from '@/generated/prisma/client';
import type {
  BannerSummary,
  IBannerRepository,
} from '../../applications/ports/output/banner.repository';

export class PrismaBannerRepository implements IBannerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listActive(): Promise<BannerSummary[]> {
    const rows = await this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        imageUrl: true,
        sortOrder: true,
      },
    });

    return rows;
  }
}
