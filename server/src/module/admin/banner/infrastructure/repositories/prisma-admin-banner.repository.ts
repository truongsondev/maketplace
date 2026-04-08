import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import type {
  AdminBannerSummary,
  NormalizedAdminBannerInput,
} from '../../applications/dto/admin-banner.dto';
import type { IAdminBannerRepository } from '../../applications/ports/output/admin-banner.repository';

export class PrismaAdminBannerRepository implements IAdminBannerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminBannerSummary[]; total: number }> {
    const where: Prisma.BannerWhereInput = {
      ...(typeof params.isActive === 'boolean' ? { isActive: params.isActive } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search } },
              { subtitle: { contains: params.search } },
              { description: { contains: params.search } },
            ],
          }
        : {}),
    };

    const skip = (params.page - 1) * params.limit;
    const [total, rows] = await Promise.all([
      this.prisma.banner.count({ where }),
      this.prisma.banner.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      total,
      items: rows.map((row) => this.toSummary(row)),
    };
  }

  async getById(id: string): Promise<AdminBannerSummary | null> {
    const row = await this.prisma.banner.findUnique({ where: { id } });
    return row ? this.toSummary(row) : null;
  }

  async create(input: NormalizedAdminBannerInput): Promise<AdminBannerSummary> {
    const created = await this.prisma.banner.create({
      data: this.toWriteInput(input),
    });
    return this.toSummary(created);
  }

  async update(id: string, input: NormalizedAdminBannerInput): Promise<AdminBannerSummary> {
    try {
      const updated = await this.prisma.banner.update({
        where: { id },
        data: this.toWriteInput(input),
      });
      return this.toSummary(updated);
    } catch (error: unknown) {
      this.mapKnownError(error);
      throw error;
    }
  }

  async setStatus(id: string, isActive: boolean): Promise<AdminBannerSummary> {
    try {
      const updated = await this.prisma.banner.update({
        where: { id },
        data: { isActive },
      });
      return this.toSummary(updated);
    } catch (error: unknown) {
      this.mapKnownError(error);
      throw error;
    }
  }

  private mapKnownError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new BadRequestError('Banner not found');
    }
  }

  private toWriteInput(input: NormalizedAdminBannerInput): Prisma.BannerUncheckedCreateInput {
    return {
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      imageUrl: input.imageUrl,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    };
  }

  private toSummary(row: {
    id: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    imageUrl: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }): AdminBannerSummary {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      imageUrl: row.imageUrl,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
