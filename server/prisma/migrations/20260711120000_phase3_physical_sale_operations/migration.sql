-- Phase 3: operational physical-store sales.
ALTER TABLE `physical_sales`
  ADD COLUMN `code` VARCHAR(40) NULL,
  ADD COLUMN `idempotency_key` VARCHAR(120) NULL,
  ADD COLUMN `status` ENUM('COMPLETED','CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN `customer_id` VARCHAR(36) NULL,
  ADD COLUMN `customer_phone` VARCHAR(20) NULL,
  ADD COLUMN `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `cancelled_at` DATETIME(3) NULL,
  ADD COLUMN `cancelled_by` VARCHAR(36) NULL,
  ADD COLUMN `cancel_reason` VARCHAR(500) NULL;
UPDATE `physical_sales` SET `code` = CONCAT('POS-', UPPER(LEFT(REPLACE(id, '-', ''), 12))), `idempotency_key` = CONCAT('legacy-', id);
ALTER TABLE `physical_sales` MODIFY `code` VARCHAR(40) NOT NULL, MODIFY `idempotency_key` VARCHAR(120) NOT NULL;
CREATE UNIQUE INDEX `physical_sales_code_key` ON `physical_sales`(`code`);
CREATE UNIQUE INDEX `physical_sales_idempotency_key_key` ON `physical_sales`(`idempotency_key`);

ALTER TABLE `physical_sale_items`
  ADD COLUMN `product_name` VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN `sku` VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN `variant_attributes` JSON NULL,
  ADD COLUMN `image_url` VARCHAR(1000) NULL,
  ADD COLUMN `line_total` DECIMAL(10,2) NOT NULL DEFAULT 0;
UPDATE `physical_sale_items` psi
JOIN `product_variants` v ON v.id = psi.variant_id
JOIN `products` p ON p.id = v.product_id
SET psi.product_name=p.name, psi.sku=v.sku, psi.variant_attributes=v.attributes, psi.line_total=psi.unit_price*psi.quantity;

