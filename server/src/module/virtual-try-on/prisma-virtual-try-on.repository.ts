import type { PrismaClient } from '@/generated/prisma/client';
import type { CreateVirtualTryOnInput, VirtualTryOnStatus } from './virtual-try-on.types';

export class PrismaVirtualTryOnRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findProduct(productId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, isDeleted: false },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        categories: { include: { category: true } },
        productType: true,
        attributeValues: { include: { attribute: true, option: true, multiSelectOptions: { include: { option: true } } } },
      },
    });
  }

  async countRecentByUser(userId: string, since: Date): Promise<number> {
    return this.prisma.virtualTryOnRequest.count({
      where: { userId, createdAt: { gte: since }, deletedAt: null },
    });
  }

  async create(params: {
    input: CreateVirtualTryOnInput;
    productImageUrl: string;
    garmentDes: string;
    forceDc: boolean;
    providerJobId: string;
    providerStatus: VirtualTryOnStatus;
    estimatedCostUsd: number;
  }) {
    return this.prisma.virtualTryOnRequest.create({
      data: {
        userId: params.input.userId,
        productId: params.input.productId,
        productImageUrl: params.productImageUrl,
        humanImageUrl: params.input.humanImageUrl,
        providerJobId: params.providerJobId,
        status: params.providerStatus,
        category: params.input.category,
        garmentDes: params.garmentDes,
        crop: Boolean(params.input.crop),
        forceDc: params.forceDc,
        maskOnly: false,
        steps: params.input.steps ?? 30,
        seed: params.input.seed,
        startedAt: new Date(),
        estimatedCostUsd: params.estimatedCostUsd,
      },
    });
  }

  findOwned(id: string, userId: string) {
    return this.prisma.virtualTryOnRequest.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  findById(id: string) {
    return this.prisma.virtualTryOnRequest.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: VirtualTryOnStatus;
      outputImageUrl?: string | null;
      outputPublicId?: string | null;
      errorCode?: string | null;
      errorMessage?: string | null;
      latencyMs?: number | null;
      completedAt?: Date | null;
    },
  ) {
    return this.prisma.virtualTryOnRequest.update({
      where: { id },
      data,
    });
  }

  listMine(userId: string, page: number, limit: number) {
    return this.prisma.$transaction([
      this.prisma.virtualTryOnRequest.count({ where: { userId, deletedAt: null } }),
      this.prisma.virtualTryOnRequest.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
  }

  softDelete(id: string, userId: string) {
    return this.prisma.virtualTryOnRequest.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  listAdmin(params: { status?: VirtualTryOnStatus; page: number; limit: number }) {
    const where = { deletedAt: null, ...(params.status ? { status: params.status } : {}) };
    return this.prisma.$transaction([
      this.prisma.virtualTryOnRequest.count({ where }),
      this.prisma.virtualTryOnRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
    ]);
  }

  async analytics() {
    const [total, success, failed, processing, avgLatency, cost] = await Promise.all([
      this.prisma.virtualTryOnRequest.count({ where: { deletedAt: null } }),
      this.prisma.virtualTryOnRequest.count({ where: { deletedAt: null, status: 'SUCCEEDED' } }),
      this.prisma.virtualTryOnRequest.count({ where: { deletedAt: null, status: 'FAILED' } }),
      this.prisma.virtualTryOnRequest.count({
        where: { deletedAt: null, status: { in: ['PENDING', 'PROCESSING'] } },
      }),
      this.prisma.virtualTryOnRequest.aggregate({
        where: { deletedAt: null, latencyMs: { not: null } },
        _avg: { latencyMs: true },
      }),
      this.prisma.virtualTryOnRequest.aggregate({
        where: { deletedAt: null },
        _sum: { estimatedCostUsd: true },
      }),
    ]);

    return {
      total,
      success,
      failed,
      processing,
      averageLatencyMs: Math.round(Number(avgLatency._avg.latencyMs ?? 0)),
      estimatedCostUsd: Number(cost._sum.estimatedCostUsd ?? 0),
    };
  }
}
