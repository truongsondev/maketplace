import { PrismaClient } from '../../../../../../generated/prisma/client';
import { IInventoryRepository } from '../../applications/ports/output';

export class PrismaInventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findLogsWithFilters(command: any): Promise<{
    items: any[];
    total: number;
  }> {
    const where: any = {};

    if (command.variantId) {
      where.variantId = command.variantId;
    }

    if (command.productId) {
      where.variant = {
        productId: command.productId,
      };
    }

    if (command.action) {
      where.action = command.action;
    }

    if (command.startDate || command.endDate) {
      where.createdAt = {};
      if (command.startDate) {
        where.createdAt.gte = new Date(command.startDate);
      }
      if (command.endDate) {
        where.createdAt.lte = new Date(command.endDate);
      }
    }

    const total = await this.prisma.inventoryLog.count({ where });

    const skip = (command.page - 1) * command.limit;
    const take = command.limit;

    const logs = await this.prisma.inventoryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      items: logs,
      total,
    };
  }

  async createLog(data: {
    variantId: string;
    action: 'IMPORT' | 'EXPORT' | 'RETURN' | 'ADJUSTMENT';
    quantity: number;
    referenceId?: string;
  }): Promise<{ id: string }> {
    const log = await this.prisma.inventoryLog.create({
      data,
    });

    return { id: log.id };
  }
}
