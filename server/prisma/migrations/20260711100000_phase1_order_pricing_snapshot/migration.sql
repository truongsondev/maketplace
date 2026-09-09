-- Phase 1: immutable product and pricing snapshots.
ALTER TABLE `orders`
  ADD COLUMN `items_subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `product_discount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `voucher_discount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `grand_total` DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE `order_items`
  ADD COLUMN `product_name` VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN `product_slug` VARCHAR(255) NULL,
  ADD COLUMN `sku` VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN `variant_name` VARCHAR(255) NULL,
  ADD COLUMN `variant_attributes` JSON NULL,
  ADD COLUMN `image_url` VARCHAR(1000) NULL,
  ADD COLUMN `original_unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `selling_unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `line_subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `line_discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `line_total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN `voucher_eligible` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `snapshot_source` VARCHAR(40) NOT NULL DEFAULT 'CHECKOUT';

UPDATE `orders`
SET `items_subtotal` = `subtotal_price`,
    `voucher_discount` = COALESCE(`discount_amount`, 0),
    `grand_total` = `total_price`;

UPDATE `order_items` oi
JOIN `products` p ON p.id = oi.product_id
LEFT JOIN `product_variants` v ON v.id = oi.variant_id
SET oi.product_name = p.name,
    oi.sku = COALESCE(v.sku, ''),
    oi.variant_attributes = v.attributes,
    oi.original_unit_price = oi.price,
    oi.selling_unit_price = oi.price,
    oi.line_subtotal = oi.price * oi.quantity,
    oi.line_total = oi.price * oi.quantity,
    oi.snapshot_source = 'LEGACY_BACKFILL';

