let PrismaClient;
try {
  ({ PrismaClient } = await import('@prisma/client'));
} catch {
  try {
    ({ PrismaClient } = await import('../generated/prisma/client.js'));
  } catch {
    // In some environments (e.g. dev container with TS-only generated client), run via `tsx`.
    ({ PrismaClient } = await import('../generated/prisma/client.ts'));
  }
}

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from server root when running locally; in docker-compose.dev the env is already injected.
const envName = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.join(__dirname, '..', `.env.${envName}`) });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || String(databaseUrl).trim().length === 0) {
  throw new Error(
    '[backfill-longterm-catalog] Missing DATABASE_URL. Set env var or provide server/.env.<env>.',
  );
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

function normalizeOptionValue(raw) {
  if (raw === null || raw === undefined) return null;
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

function buildOptionKeyFromJsonAttributes(attributes) {
  if (!attributes || typeof attributes !== 'object') return 'default';

  const entries = Object.entries(attributes)
    .filter(([k, v]) => k && v !== null && v !== undefined && `${v}`.trim() !== '')
    .map(([k, v]) => [String(k).trim(), String(v).trim()]);

  if (entries.length === 0) return 'default';

  // Backfill stage: no axis order available yet => stable alphabetical sort.
  entries.sort(([a], [b]) => a.localeCompare(b));

  return entries.map(([k, v]) => `${k}=${v}`).join('|');
}

async function ensureDefaultProductType() {
  const existing = await prisma.productType.findUnique({ where: { code: 'default' } });
  if (existing) return existing;

  return prisma.productType.create({
    data: {
      code: 'default',
      name: 'Default',
      description: 'Fallback product type for migrated data',
    },
  });
}

async function ensureBaseProductTypes() {
  const base = [
    { code: 'default', name: 'Default', description: 'Fallback product type for migrated data' },
    { code: 'ao', name: 'Áo', description: 'Áo (root)' },
    { code: 'quan', name: 'Quần', description: 'Quần (root)' },
    { code: 'vong_tay', name: 'Vòng tay', description: 'Vòng tay (root)' },
    { code: 'phu_kien', name: 'Phụ kiện', description: 'Phụ kiện (root)' },
  ];

  const existing = await prisma.productType.findMany({
    where: { code: { in: base.map((b) => b.code) } },
    select: { id: true, code: true },
  });

  const idByCode = new Map(existing.map((t) => [t.code, t.id]));
  for (const t of base) {
    if (idByCode.has(t.code)) continue;
    const created = await prisma.productType.create({
      data: { code: t.code, name: t.name, description: t.description },
      select: { id: true, code: true },
    });
    idByCode.set(created.code, created.id);
  }

  return idByCode;
}

async function ensureAxisAttributeDefinitions() {
  const wanted = [
    { code: 'color', name: 'Màu sắc' },
    { code: 'size', name: 'Kích cỡ' },
  ];

  const existing = await prisma.attributeDefinition.findMany({
    where: { code: { in: wanted.map((w) => w.code) } },
    select: { id: true, code: true },
  });

  const idByCode = new Map(existing.map((d) => [d.code, d.id]));
  for (const d of wanted) {
    if (idByCode.has(d.code)) continue;
    const created = await prisma.attributeDefinition.create({
      data: {
        code: d.code,
        name: d.name,
        scope: 'VARIANT',
        dataType: 'SELECT',
      },
      select: { id: true, code: true },
    });
    idByCode.set(created.code, created.id);
  }

  return idByCode;
}

async function ensureProductTypeAxisAttributes(productTypeIds, attributeIds) {
  const productTypeIdList = Array.from(productTypeIds.values());
  const colorId = attributeIds.get('color');
  const sizeId = attributeIds.get('size');
  if (!colorId || !sizeId) return 0;

  let created = 0;
  for (const productTypeId of productTypeIdList) {
    for (const [attributeId, order] of [
      [colorId, 1],
      [sizeId, 2],
    ]) {
      const exists = await prisma.productTypeAttribute.findUnique({
        where: { productTypeId_attributeId: { productTypeId, attributeId } },
        select: { productTypeId: true },
      });
      if (exists) continue;

      await prisma.productTypeAttribute.create({
        data: {
          productTypeId,
          attributeId,
          isRequired: false,
          isFilterable: true,
          isVariantAxis: true,
          variantAxisOrder: order,
        },
      });
      created++;
    }
  }

  return created;
}

async function backfillProductType(productTypeId) {
  const res = await prisma.product.updateMany({
    where: { productTypeId: null },
    data: { productTypeId },
  });
  return res.count;
}

async function backfillStockOnHand() {
  // Only copy when stockOnHand is still default and stockAvailable is meaningful.
  // If your business already changed stockOnHand, you can remove this condition.
  const variants = await prisma.productVariant.findMany({
    select: { id: true, stockAvailable: true, stockOnHand: true },
  });

  let updated = 0;
  for (const v of variants) {
    if ((v.stockOnHand ?? 0) === 0 && (v.stockAvailable ?? 0) > 0) {
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { stockOnHand: v.stockAvailable },
      });
      updated++;
    }
  }

  return updated;
}

async function backfillVariantOptionKeysAndDefaults() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      variants: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
        select: { id: true, attributes: true, optionKey: true, isDefault: true },
      },
    },
  });

  let updatedOptionKeys = 0;
  let updatedDefaults = 0;
  let duplicateKeys = 0;

  for (const product of products) {
    const variants = product.variants;
    if (variants.length === 0) continue;

    // Determine which variant should be default.
    const currentDefault = variants.find((v) => v.isDefault);
    const defaultVariantId = currentDefault?.id ?? variants[0].id;

    const seen = new Map();

    for (const variant of variants) {
      // optionKey
      if (!variant.optionKey || variant.optionKey.trim() === '') {
        const key = buildOptionKeyFromJsonAttributes(variant.attributes);

        // Detect duplicates inside same product (should not happen, but legacy JSON might cause it).
        const prev = seen.get(key);
        if (prev) {
          duplicateKeys++;
          // Keep the original key for the first variant, and make the other one unique-but-obvious.
          // IMPORTANT: This is a temporary backfill safety net.
          const uniqueKey = `${key}|legacyVariantId=${variant.id}`;
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { optionKey: uniqueKey },
          });
          updatedOptionKeys++;
        } else {
          seen.set(key, variant.id);
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { optionKey: key },
          });
          updatedOptionKeys++;
        }
      } else {
        seen.set(variant.optionKey, variant.id);
      }

      // isDefault
      if (variant.id === defaultVariantId && !variant.isDefault) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { isDefault: true },
        });
        updatedDefaults++;
      }
      if (variant.id !== defaultVariantId && variant.isDefault) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { isDefault: false },
        });
        updatedDefaults++;
      }
    }
  }

  return { updatedOptionKeys, updatedDefaults, duplicateKeys };
}

async function backfillVariantAxisAttributeValues() {
  // Backfill long-term normalized attributes from legacy JSON variant.attributes
  // - Upsert AttributeOption by (attributeId, value)
  // - Upsert VariantAttributeValue by (variantId, attributeId)
  // Safety: if attribute definitions are missing, skip (do not invent schema semantics here).

  const attrIdByCode = await ensureAxisAttributeDefinitions();

  const variants = await prisma.productVariant.findMany({
    where: { isDeleted: false },
    select: { id: true, attributes: true },
  });

  let updatedVariantAttributeValues = 0;
  let createdOptions = 0;
  let skippedVariants = 0;

  for (const v of variants) {
    const attrs = v.attributes && typeof v.attributes === 'object' ? v.attributes : {};

    let didAny = false;
    for (const code of ['color', 'size']) {
      const attributeId = attrIdByCode.get(code);
      const raw = attrs?.[code];
      const normalized = normalizeOptionValue(raw);
      if (!normalized) continue;

      const label = String(raw).trim();

      const existingOption = await prisma.attributeOption.findUnique({
        where: { attributeId_value: { attributeId, value: normalized } },
        select: { id: true },
      });

      const option = existingOption
        ? await prisma.attributeOption.update({
            where: { id: existingOption.id },
            data: { label },
            select: { id: true },
          })
        : await prisma.attributeOption.create({
            data: { attributeId, value: normalized, label },
            select: { id: true },
          });

      if (!existingOption) createdOptions++;

      await prisma.variantAttributeValue.upsert({
        where: { variantId_attributeId: { variantId: v.id, attributeId } },
        update: { optionId: option.id },
        create: { variantId: v.id, attributeId, optionId: option.id },
      });

      updatedVariantAttributeValues++;
      didAny = true;
    }

    if (!didAny) skippedVariants++;
  }

  return { updatedVariantAttributeValues, createdOptions, skippedVariants };
}

async function backfillPrimaryCategory() {
  const productIds = await prisma.productCategory.findMany({
    distinct: ['productId'],
    select: { productId: true },
  });

  let updated = 0;

  for (const { productId } of productIds) {
    const existingPrimary = await prisma.productCategory.findFirst({
      where: { productId, isPrimary: true },
      select: { productId: true, categoryId: true },
    });

    if (existingPrimary) continue;

    const first = await prisma.productCategory.findFirst({
      where: { productId },
      orderBy: { categoryId: 'asc' },
      select: { productId: true, categoryId: true },
    });

    if (!first) continue;

    await prisma.productCategory.update({
      where: {
        productId_categoryId: {
          productId: first.productId,
          categoryId: first.categoryId,
        },
      },
      data: { isPrimary: true },
    });

    updated++;
  }

  return updated;
}

async function main() {
  const productTypeIds = await ensureBaseProductTypes();
  const attributeIds = await ensureAxisAttributeDefinitions();
  const createdTypeAttrs = await ensureProductTypeAxisAttributes(productTypeIds, attributeIds);

  const defaultTypeId = productTypeIds.get('default');
  if (!defaultTypeId)
    throw new Error('[backfill-longterm-catalog] Missing default product type id');

  const updatedProducts = await backfillProductType(defaultTypeId);
  const updatedStock = await backfillStockOnHand();
  const variantBackfill = await backfillVariantOptionKeysAndDefaults();
  const axisBackfill = await backfillVariantAxisAttributeValues();
  const updatedPrimaryCats = await backfillPrimaryCategory();

  console.log('[backfill-longterm-catalog] done');
  console.log({
    defaultProductTypeId: defaultTypeId,
    createdProductTypeAttributes: createdTypeAttrs,
    updatedProducts,
    updatedStock,
    ...variantBackfill,
    ...axisBackfill,
    updatedPrimaryCats,
  });

  if (variantBackfill.duplicateKeys > 0) {
    console.warn(
      '[backfill-longterm-catalog] WARNING: duplicate legacy variant combinations detected. ' +
        'They were made unique by appending legacyVariantId; you should clean up or merge duplicates later.',
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
