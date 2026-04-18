import { PrismaClient } from '../../../../../generated/prisma/client';
import { AxisAttributeDto, ProductTypeSchemaDto } from '../../applications/dto';
import { IProductTypeSchemaRepository } from '../../applications/ports/output';

export class PrismaProductTypeSchemaRepository implements IProductTypeSchemaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async resolveRootCategorySlug(categoryId: string): Promise<string | null> {
    type CategoryNode = { id: string; parentId: string | null; slug: string };

    const start = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, parentId: true, slug: true },
    });

    if (!start) return null;
    let current: CategoryNode = start;

    const seen = new Set<string>();
    while (current.parentId) {
      if (seen.has(current.id)) return null;
      seen.add(current.id);

      const parent: CategoryNode | null = await this.prisma.category.findUnique({
        where: { id: current.parentId },
        select: { id: true, parentId: true, slug: true },
      });

      if (!parent) return current.slug ?? null;
      current = parent;
    }

    return current.slug ?? null;
  }

  private mapRootSlugToProductTypeCode(rootSlug: string | null): string {
    if (rootSlug === 'ao') return 'ao';
    if (rootSlug === 'quan') return 'quan';
    if (rootSlug === 'vay' || rootSlug === 'vay') return 'vay';
    return 'phu_kien';
  }

  async getSchemaByCategoryId(categoryId: string): Promise<ProductTypeSchemaDto> {
    const rootSlug = await this.resolveRootCategorySlug(categoryId);
    const typeCode = this.mapRootSlugToProductTypeCode(rootSlug);

    const productType =
      (await this.prisma.productType.findUnique({
        where: { code: typeCode },
        select: { id: true, code: true, name: true },
      })) ??
      (await this.prisma.productType.findUnique({
        where: { code: 'phu_kien' },
        select: { id: true, code: true, name: true },
      }));

    if (!productType) {
      return { productType: null, variantAxisAttributes: [] };
    }

    const ptas = await this.prisma.productTypeAttribute.findMany({
      where: {
        productTypeId: productType.id,
        isVariantAxis: true,
      },
      select: {
        attributeId: true,
        variantAxisOrder: true,
      },
    });

    const axisOrderByAttrId = new Map<string, number | null>(
      ptas.map((p) => [p.attributeId, p.variantAxisOrder] as const),
    );

    const attributeIds = ptas.map((p) => p.attributeId);
    if (attributeIds.length === 0) {
      return { productType, variantAxisAttributes: [] };
    }

    const defs = await this.prisma.attributeDefinition.findMany({
      where: { id: { in: attributeIds } },
      select: {
        id: true,
        code: true,
        name: true,
        dataType: true,
        unit: true,
      },
    });

    const axisAttributes: AxisAttributeDto[] = defs.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      dataType: String(d.dataType),
      unit: d.unit,
      axisOrder: axisOrderByAttrId.get(d.id) ?? null,
    }));

    axisAttributes.sort((a, b) => {
      const ao = a.axisOrder ?? 999;
      const bo = b.axisOrder ?? 999;
      if (ao !== bo) return ao - bo;
      return a.code.localeCompare(b.code);
    });

    return {
      productType,
      variantAxisAttributes: axisAttributes,
    };
  }
}
