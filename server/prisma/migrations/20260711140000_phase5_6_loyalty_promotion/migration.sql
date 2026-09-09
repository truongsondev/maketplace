-- Phase 5: loyalty ledger hardening.
ALTER TABLE `loyalty_config`
  ADD COLUMN `silver_min_points` INT NOT NULL DEFAULT 1000,
  ADD COLUMN `gold_min_points` INT NOT NULL DEFAULT 5000;

ALTER TABLE `loyalty_transactions`
  ADD COLUMN `expired_at` DATETIME(3) NULL,
  ADD COLUMN `source_points` INT NULL,
  ADD COLUMN `source_transaction_id` VARCHAR(36) NULL,
  ADD INDEX `loyalty_transactions_expires_at_expired_at_idx` (`expires_at`, `expired_at`);

-- Phase 6: automatic promotions.
ALTER TABLE `orders`
  ADD COLUMN `promotion_discount` DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE `order_items`
  ADD COLUMN `promotion_discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `voucher_discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `promotion_id` VARCHAR(36) NULL,
  ADD COLUMN `promotion_name` VARCHAR(255) NULL,
  ADD COLUMN `promotion_snapshot` JSON NULL,
  ADD INDEX `order_items_promotion_id_idx` (`promotion_id`);

CREATE TABLE `promotions` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` VARCHAR(500) NULL,
  `type` ENUM('PERCENTAGE','FIXED_AMOUNT','SALE_PRICE','COMBO_FIXED','BUY_X_GET_Y') NOT NULL,
  `status` ENUM('DRAFT','ACTIVE','PAUSED','EXPIRED') NOT NULL DEFAULT 'DRAFT',
  `scope_type` ENUM('ALL_PRODUCTS','INCLUDE_CATEGORIES','INCLUDE_PRODUCTS') NOT NULL DEFAULT 'ALL_PRODUCTS',
  `include_descendants` BOOLEAN NOT NULL DEFAULT FALSE,
  `value` DECIMAL(10, 2) NOT NULL,
  `max_discount` DECIMAL(10, 2) NULL,
  `priority` INT NOT NULL DEFAULT 0,
  `usage_limit` INT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `stackable_with_voucher` BOOLEAN NOT NULL DEFAULT TRUE,
  `start_at` DATETIME(3) NOT NULL,
  `end_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `promotions_status_start_at_end_at_idx` (`status`, `start_at`, `end_at`),
  INDEX `promotions_priority_idx` (`priority`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `promotion_included_categories` (
  `promotion_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`promotion_id`, `category_id`),
  INDEX `promotion_included_categories_category_id_idx` (`category_id`),
  CONSTRAINT `promotion_included_categories_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `promotion_included_categories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `promotion_included_products` (
  `promotion_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`promotion_id`, `product_id`),
  INDEX `promotion_included_products_product_id_idx` (`product_id`),
  CONSTRAINT `promotion_included_products_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `promotion_included_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `promotion_usages` (
  `id` VARCHAR(36) NOT NULL,
  `promotion_id` VARCHAR(36) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `discount_amount` DECIMAL(10, 2) NOT NULL,
  `idempotency_key` VARCHAR(120) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `promotion_usages_idempotency_key_key` (`idempotency_key`),
  UNIQUE INDEX `promotion_usages_promotion_id_order_id_key` (`promotion_id`, `order_id`),
  INDEX `promotion_usages_order_id_idx` (`order_id`),
  CONSTRAINT `promotion_usages_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `promotion_usages_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE SET NULL;

UPDATE `order_items`
SET `voucher_discount_amount` = `line_discount_amount`
WHERE `voucher_discount_amount` = 0 AND `line_discount_amount` > 0;
