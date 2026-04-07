import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { BadRequestError } from '../../../../../error-handlling/badRequestError';
import type {
  AdminVoucherSummary,
  NormalizedAdminVoucherInput,
} from '../../applications/dto/admin-voucher.dto';
import type { IAdminVoucherRepository } from '../../applications/ports/output/admin-voucher.repository';

export class PrismaAdminVoucherRepository implements IAdminVoucherRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminVoucherSummary[]; total: number }> {
    const where: Prisma.DiscountWhereInput = {
      ...(typeof params.isActive === 'boolean' ? { isActive: params.isActive } : {}),
      ...(params.search
        ? {
            OR: [
              { code: { contains: params.search } },
              { description: { contains: params.search } },
            ],
          }
        : {}),
    };

    const skip = (params.page - 1) * params.limit;
    const [total, rows] = await Promise.all([
      this.prisma.discount.count({ where }),
      this.prisma.discount.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    return {
      total,
      items: rows.map((row) => this.toSummary(row)),
    };
  }

  async getById(id: string): Promise<AdminVoucherSummary | null> {
    const row = await this.prisma.discount.findUnique({ where: { id } });
    return row ? this.toSummary(row) : null;
  }

  async create(input: NormalizedAdminVoucherInput): Promise<AdminVoucherSummary> {
    try {
      const created = await this.prisma.discount.create({
        data: this.toWriteInput(input),
      });
      return this.toSummary(created);
    } catch (error: unknown) {
      this.mapKnownError(error);
      throw error;
    }
  }

  async update(id: string, input: NormalizedAdminVoucherInput): Promise<AdminVoucherSummary> {
    try {
      const updated = await this.prisma.discount.update({
        where: { id },
        data: this.toWriteInput(input),
      });
      return this.toSummary(updated);
    } catch (error: unknown) {
      this.mapKnownError(error);
      throw error;
    }
  }

  async setStatus(id: string, isActive: boolean): Promise<AdminVoucherSummary> {
    try {
      const updated = await this.prisma.discount.update({
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestError('Voucher code already exists');
      }
      if (error.code === 'P2025') {
        throw new BadRequestError('Voucher not found');
      }
    }
  }

  private toWriteInput(input: NormalizedAdminVoucherInput): Prisma.DiscountUncheckedCreateInput {
    return {
      code: input.code,
      description: input.description,
      type: input.type,
      value: new Prisma.Decimal(input.value),
      maxDiscount:
        input.maxDiscount !== null && input.maxDiscount !== undefined
          ? new Prisma.Decimal(input.maxDiscount)
          : null,
      minOrderAmount:
        input.minOrderAmount !== null && input.minOrderAmount !== undefined
          ? new Prisma.Decimal(input.minOrderAmount)
          : null,
      maxUsage: input.maxUsage,
      userUsageLimit: input.userUsageLimit,
      startAt: input.startAt,
      endAt: input.endAt,
      isActive: input.isActive,
      bannerImageUrl: input.bannerImageUrl,
    };
  }

  private toSummary(row: {
    id: string;
    code: string;
    description: string | null;
    type: any;
    value: Prisma.Decimal;
    maxDiscount: Prisma.Decimal | null;
    minOrderAmount: Prisma.Decimal | null;
    maxUsage: number | null;
    userUsageLimit: number | null;
    usedCount: number;
    startAt: Date;
    endAt: Date;
    isActive: boolean;
    bannerImageUrl: string | null;
  }): AdminVoucherSummary {
    return {
      id: row.id,
      code: row.code,
      description: row.description,
      type: row.type,
      value: Number(row.value),
      maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null,
      minOrderAmount: row.minOrderAmount ? Number(row.minOrderAmount) : null,
      maxUsage: row.maxUsage,
      userUsageLimit: row.userUsageLimit,
      usedCount: row.usedCount,
      startAt: row.startAt,
      endAt: row.endAt,
      isActive: row.isActive,
      bannerImageUrl: row.bannerImageUrl,
    };
  }
}
