import { PrismaClient } from '../generated/prisma/client/index.js';

const prisma = new PrismaClient();

function normalizeOptionValue(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;

  const ascii = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  const normalized = ascii
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-]/g, '');

  return normalized || null;
}

function labelize(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  return value;
}

function safeJsonObject(val) {
  if (!val) return null;
  if (typeof val !== 'object') return null;
  if (Array.isArray(val)) return null;
  return val;
}

function buildCategoryAncestorResolver(categories) {
  const byId = new Map(categories.map((c) => [c.id, c]));

  function getRootSlug(categoryId) {
    let current = byId.get(categoryId);
    if (!current) return null;

    const seen = new Set();
    while (current && current.parentId) {
      if (seen.has(current.id)) return null;
      seen.add(current.id);
      current = byId.get(current.parentId);
    }
    return current?.slug ?? null;
  }

  return { getRootSlug };
}

async function ensureProductTypes() {
  const types = await prisma.productType.findMany({ select: { id: true, code: true } });
  const map = new Map(types.map((t) => [t.code, t.id]));

  const required = [
    { code: 'ao', name: 'Áo' },
    { code: 'quan', name: 'Quần' },
    { code: 'phu_kien', name: 'Phụ kiện' },
    { code: 'vong_tay', name: 'Vòng tay' },
  ];

  for (const r of required) {
    if (!map.has(r.code)) {
      const created = await prisma.productType.create({
        data: { code: r.code, name: r.name },
        select: { id: true, code: true },
      });
      map.set(created.code, created.id);
    }
  }

  return map;
}

async function getAttrIds() {
  const attrs = await prisma.attributeDefinition.findMany({
    where: { code: { in: ['color', 'size'] } },
    select: { id: true, code: true },
  });

  const map = new Map(attrs.map((a) => [a.code, a.id]));
  if (!map.get('color') || !map.get('size')) {
    throw new Error(
      'Missing AttributeDefinition for color/size. Run seed-attribute-system.mjs first.',
    );
  }
  return map;
}

async function upsertOption(attributeId, rawValue) {
  const normalized = normalizeOptionValue(rawValue);
  const label = labelize(rawValue);
  if (!normalized || !label) return null;

  return prisma.attributeOption.upsert({
    where: { attributeId_value: { attributeId, value: normalized } },
    update: { label },
    create: { attributeId, value: normalized, label },
    select: { id: true, value: true },
  });
}

async function upsertVariantAttributeValue(variantId, attributeId, optionId) {
  return prisma.variantAttributeValue.upsert({
    where: { variantId_attributeId: { variantId, attributeId } },
    update: { optionId },
    create: { variantId, attributeId, optionId },
  });
}

async function maybeBackfillVariantAxis(variant, attrIds) {
  const attrs = safeJsonObject(variant.attributes);
  if (!attrs) return { changed: false, reason: 'no-json' };

  const colorRaw = attrs.color;
  const sizeRaw = attrs.size;

  let changed = false;

  if (colorRaw != null) {
    const option = await upsertOption(attrIds.get('color'), colorRaw);
    if (option) {
      await upsertVariantAttributeValue(variant.id, attrIds.get('color'), option.id);
      changed = true;
    }
  }

  if (sizeRaw != null) {
    const option = await upsertOption(attrIds.get('size'), sizeRaw);
    if (option) {
      await upsertVariantAttributeValue(variant.id, attrIds.get('size'), option.id);
      changed = true;
    }
  }

  return { changed, reason: changed ? 'ok' : 'no-axis' };
}

async function assignProductTypesIfMissing(productTypeIdsByCode, categoryRootSlugByCategoryId) {
  const products = await prisma.product.findMany({
    where: {
      OR: [{ productTypeId: null }, { productType: { code: 'default' } }],
    },
    select: {
      id: true,
      productCategories: { select: { categoryId: true, isPrimary: true } },
    },
  });

  let updated = 0;

  for (const p of products) {
    const primary = p.productCategories.find((pc) => pc.isPrimary);
    const candidate = primary ?? p.productCategories[0];

    let typeCode = 'phu_kien';
    if (candidate?.categoryId) {
      const rootSlug = categoryRootSlugByCategoryId(candidate.categoryId);
      if (rootSlug === 'ao') typeCode = 'ao';
      else if (rootSlug === 'quan') typeCode = 'quan';
      else if (rootSlug === 'vong-tay' || rootSlug === 'vong_tay') typeCode = 'vong_tay';
      else typeCode = 'phu_kien';
    }

    const productTypeId =
      productTypeIdsByCode.get(typeCode) ?? productTypeIdsByCode.get('phu_kien');
    if (!productTypeId) continue;

    await prisma.product.update({
      where: { id: p.id },
      data: { productTypeId },
    });

    updated++;
  }

  return updated;
}

async function main() {
  const productTypeIdsByCode = await ensureProductTypes();
  const attrIdsByCode = await getAttrIds();

  // Build category root resolver in-memory
  const categories = await prisma.category.findMany({
    select: { id: true, parentId: true, slug: true },
  });
  const { getRootSlug } = buildCategoryAncestorResolver(categories);

  const updatedProducts = await assignProductTypesIfMissing(productTypeIdsByCode, getRootSlug);

  // Backfill variant axes from legacy JSON attributes
  const variants = await prisma.productVariant.findMany({
    select: { id: true, attributes: true },
  });

  let changedVariants = 0;
  let skippedNoJson = 0;

  for (const v of variants) {
    const res = await maybeBackfillVariantAxis(v, attrIdsByCode);
    if (res.changed) changedVariants++;
    else if (res.reason === 'no-json') skippedNoJson++;
  }

  console.log('[backfill-variant-attributes] done');
  console.log({ updatedProducts, changedVariants, skippedNoJson, totalVariants: variants.length });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
