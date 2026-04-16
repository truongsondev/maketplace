import { PrismaClient } from '../generated/prisma/client/index.js';

const prisma = new PrismaClient();

async function upsertProductType(code, name) {
  return prisma.productType.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function upsertAttributeDefinition({ code, name, scope, dataType, unit = null }) {
  return prisma.attributeDefinition.upsert({
    where: { code },
    update: { name, scope, dataType, unit },
    create: { code, name, scope, dataType, unit },
  });
}

async function upsertAttributeOption(attributeId, value, label, extra = {}) {
  return prisma.attributeOption.upsert({
    where: {
      attributeId_value: {
        attributeId,
        value,
      },
    },
    update: { label, ...extra },
    create: { attributeId, value, label, ...extra },
  });
}

async function upsertProductTypeAttribute({
  productTypeId,
  attributeId,
  isRequired,
  isFilterable,
  isVariantAxis,
  variantAxisOrder,
}) {
  return prisma.productTypeAttribute.upsert({
    where: {
      productTypeId_attributeId: {
        productTypeId,
        attributeId,
      },
    },
    update: { isRequired, isFilterable, isVariantAxis, variantAxisOrder },
    create: {
      productTypeId,
      attributeId,
      isRequired,
      isFilterable,
      isVariantAxis,
      variantAxisOrder,
    },
  });
}

async function seedOptionsColor(attributeId) {
  const colors = [
    { value: 'black', label: 'Đen' },
    { value: 'white', label: 'Trắng' },
    { value: 'gray', label: 'Xám' },
    { value: 'navy', label: 'Xanh navy' },
    { value: 'blue', label: 'Xanh' },
    { value: 'green', label: 'Xanh lá' },
    { value: 'red', label: 'Đỏ' },
    { value: 'brown', label: 'Nâu' },
    { value: 'beige', label: 'Be' },
    { value: 'cream', label: 'Kem' },
  ];

  for (let i = 0; i < colors.length; i++) {
    await upsertAttributeOption(attributeId, colors[i].value, colors[i].label, {
      sortOrder: i * 10,
    });
  }
}

async function seedOptionsSizeApparel(attributeId) {
  const sizes = [
    { value: 'xs', label: 'XS' },
    { value: 's', label: 'S' },
    { value: 'm', label: 'M' },
    { value: 'l', label: 'L' },
    { value: 'xl', label: 'XL' },
    { value: 'xxl', label: 'XXL' },
  ];

  for (let i = 0; i < sizes.length; i++) {
    await upsertAttributeOption(attributeId, sizes[i].value, sizes[i].label, { sortOrder: i * 10 });
  }
}

async function seedOptionsHatStyle(attributeId) {
  const styles = [
    { value: 'dad_hat', label: 'Nón dad hat' },
    { value: 'baseball_cap', label: 'Nón baseball cap' },
    { value: 'trucker_cap', label: 'Nón trucker cap' },
    { value: 'snapback', label: 'Nón snapback' },
    { value: 'bucket_hat', label: 'Nón bucket' },
    { value: 'fitted_cap', label: 'Nón fitted cap' },
    { value: 'five_panel_cap', label: 'Nón 5 panel cap' },
  ];

  for (let i = 0; i < styles.length; i++) {
    await upsertAttributeOption(attributeId, styles[i].value, styles[i].label, {
      sortOrder: i * 10,
    });
  }
}

async function seedOptionsMaterial(attributeId) {
  const mats = [
    { value: 'cotton', label: 'Cotton' },
    { value: 'polyester', label: 'Polyester' },
    { value: 'spandex', label: 'Spandex' },
    { value: 'denim', label: 'Denim' },
    { value: 'canvas', label: 'Canvas' },
    { value: 'leather', label: 'Da' },
    { value: 'nylon', label: 'Nylon' },
    { value: 'wool', label: 'Len' },
  ];

  for (let i = 0; i < mats.length; i++) {
    await upsertAttributeOption(attributeId, mats[i].value, mats[i].label, { sortOrder: i * 10 });
  }
}

async function main() {
  // Product types (rút gọn theo yêu cầu)
  const ptAo = await upsertProductType('ao', 'Áo');
  const ptQuan = await upsertProductType('quan', 'Quần');
  const ptPhuKien = await upsertProductType('phu_kien', 'Phụ kiện');
  const ptVongTay = await upsertProductType('vong_tay', 'Vòng tay');

  // Attribute definitions (minimal but long-term safe)
  const attrColor = await upsertAttributeDefinition({
    code: 'color',
    name: 'Màu sắc',
    scope: 'VARIANT',
    dataType: 'SELECT',
  });

  const attrSize = await upsertAttributeDefinition({
    code: 'size',
    name: 'Kích cỡ',
    scope: 'VARIANT',
    dataType: 'SELECT',
  });

  const attrMaterial = await upsertAttributeDefinition({
    code: 'material',
    name: 'Chất liệu',
    scope: 'PRODUCT',
    dataType: 'MULTI_SELECT',
  });

  // hat_style là descriptive (không tạo SKU) theo lựa chọn
  const attrHatStyle = await upsertAttributeDefinition({
    code: 'hat_style',
    name: 'Kiểu dáng mũ/nón',
    scope: 'PRODUCT',
    dataType: 'SELECT',
  });

  // Bracelet Mode 1: descriptive at Product
  const attrBraceletMaterial = await upsertAttributeDefinition({
    code: 'bracelet_material',
    name: 'Chất liệu vòng tay',
    scope: 'PRODUCT',
    dataType: 'SELECT',
  });

  const attrBraceletDiameter = await upsertAttributeDefinition({
    code: 'bracelet_diameter_mm',
    name: 'Đường kính (mm)',
    scope: 'PRODUCT',
    dataType: 'NUMBER',
    unit: 'mm',
  });

  const attrStoneType = await upsertAttributeDefinition({
    code: 'stone_type',
    name: 'Loại đá',
    scope: 'PRODUCT',
    dataType: 'SELECT',
  });

  // Options
  await seedOptionsColor(attrColor.id);
  await seedOptionsSizeApparel(attrSize.id);
  await seedOptionsMaterial(attrMaterial.id);
  await seedOptionsHatStyle(attrHatStyle.id);

  // Minimal options for bracelet/stones (can expand later)
  await upsertAttributeOption(attrBraceletMaterial.id, 'silver', 'Bạc', { sortOrder: 10 });
  await upsertAttributeOption(attrBraceletMaterial.id, 'gold', 'Vàng', { sortOrder: 20 });
  await upsertAttributeOption(attrBraceletMaterial.id, 'leather', 'Da', { sortOrder: 30 });
  await upsertAttributeOption(attrBraceletMaterial.id, 'rope', 'Dây', { sortOrder: 40 });
  await upsertAttributeOption(attrBraceletMaterial.id, 'stone', 'Đá', { sortOrder: 50 });

  await upsertAttributeOption(attrStoneType.id, 'none', 'Không', { sortOrder: 10 });
  await upsertAttributeOption(attrStoneType.id, 'onyx', 'Onyx', { sortOrder: 20 });
  await upsertAttributeOption(attrStoneType.id, 'agate', 'Agate', { sortOrder: 30 });
  await upsertAttributeOption(attrStoneType.id, 'quartz', 'Quartz', { sortOrder: 40 });

  // ProductType ↔ Attributes mapping
  // Áo: axes color/size
  await upsertProductTypeAttribute({
    productTypeId: ptAo.id,
    attributeId: attrColor.id,
    isRequired: true,
    isFilterable: true,
    isVariantAxis: true,
    variantAxisOrder: 1,
  });
  await upsertProductTypeAttribute({
    productTypeId: ptAo.id,
    attributeId: attrSize.id,
    isRequired: true,
    isFilterable: true,
    isVariantAxis: true,
    variantAxisOrder: 2,
  });
  await upsertProductTypeAttribute({
    productTypeId: ptAo.id,
    attributeId: attrMaterial.id,
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    variantAxisOrder: null,
  });

  // Quần: axes color/size
  await upsertProductTypeAttribute({
    productTypeId: ptQuan.id,
    attributeId: attrColor.id,
    isRequired: true,
    isFilterable: true,
    isVariantAxis: true,
    variantAxisOrder: 1,
  });
  await upsertProductTypeAttribute({
    productTypeId: ptQuan.id,
    attributeId: attrSize.id,
    isRequired: true,
    isFilterable: true,
    isVariantAxis: true,
    variantAxisOrder: 2,
  });
  await upsertProductTypeAttribute({
    productTypeId: ptQuan.id,
    attributeId: attrMaterial.id,
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    variantAxisOrder: null,
  });

  // Phụ kiện: descriptive (hat_style/material) — không axis
  await upsertProductTypeAttribute({
    productTypeId: ptPhuKien.id,
    attributeId: attrMaterial.id,
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    variantAxisOrder: null,
  });
  await upsertProductTypeAttribute({
    productTypeId: ptPhuKien.id,
    attributeId: attrHatStyle.id,
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    variantAxisOrder: null,
  });

  // Vòng tay: descriptive
  await upsertProductTypeAttribute({
    productTypeId: ptVongTay.id,
    attributeId: attrBraceletMaterial.id,
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    variantAxisOrder: null,
  });
  await upsertProductTypeAttribute({
    productTypeId: ptVongTay.id,
    attributeId: attrBraceletDiameter.id,
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    variantAxisOrder: null,
  });
  await upsertProductTypeAttribute({
    productTypeId: ptVongTay.id,
    attributeId: attrStoneType.id,
    isRequired: false,
    isFilterable: true,
    isVariantAxis: false,
    variantAxisOrder: null,
  });

  console.log('[seed-attribute-system] done');
  console.log({
    productTypes: { ao: ptAo.id, quan: ptQuan.id, phu_kien: ptPhuKien.id, vong_tay: ptVongTay.id },
    attributes: {
      color: attrColor.id,
      size: attrSize.id,
      material: attrMaterial.id,
      hat_style: attrHatStyle.id,
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
