-- DropForeignKey
ALTER TABLE `cart_items` DROP FOREIGN KEY `cart_items_cart_id_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_logs` DROP FOREIGN KEY `inventory_logs_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_order_id_fkey`;

-- DropIndex
DROP INDEX `cart_items_cart_id_product_id_key` ON `cart_items`;

-- DropIndex
DROP INDEX `inventory_logs_product_id_idx` ON `inventory_logs`;

-- DropIndex
DROP INDEX `order_items_order_id_product_id_key` ON `order_items`;

-- AlterTable
ALTER TABLE `cart_items` ADD COLUMN `variant_id` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `inventory_logs` DROP COLUMN `product_id`,
    ADD COLUMN `variant_id` VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `variant_id` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `discount_amount` DECIMAL(10, 2) NULL,
    ADD COLUMN `discount_id` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `min_stock`,
    DROP COLUMN `price`,
    DROP COLUMN `stock_available`,
    DROP COLUMN `stock_reserved`,
    ADD COLUMN `base_price` DECIMAL(10, 2) NOT NULL;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `attributes` JSON NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `stock_available` INTEGER NOT NULL DEFAULT 0,
    `stock_reserved` INTEGER NOT NULL DEFAULT 0,
    `min_stock` INTEGER NOT NULL DEFAULT 5,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_variants_sku_key`(`sku`),
    INDEX `product_variants_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `variant_id` VARCHAR(36) NULL,
    `url` VARCHAR(1000) NOT NULL,
    `alt_text` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_images_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `image_url` VARCHAR(1000) NULL,
    `parent_id` VARCHAR(36) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_parent_id_idx`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_categories` (
    `product_id` VARCHAR(36) NOT NULL,
    `category_id` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`product_id`, `category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `tags_name_key`(`name`),
    UNIQUE INDEX `tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_tags` (
    `product_id` VARCHAR(36) NOT NULL,
    `tag_id` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`product_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_price_history` (
    `id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `variant_id` VARCHAR(36) NULL,
    `old_price` DECIMAL(10, 2) NOT NULL,
    `new_price` DECIMAL(10, 2) NOT NULL,
    `changed_by` VARCHAR(36) NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_price_history_product_id_idx`(`product_id`),
    INDEX `product_price_history_variant_id_idx`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discounts` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(500) NULL,
    `type` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `min_order_amount` DECIMAL(10, 2) NULL,
    `max_usage` INTEGER NULL,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `discounts_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discount_usages` (
    `id` VARCHAR(36) NOT NULL,
    `discount_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `discount_usages_order_id_key`(`order_id`),
    INDEX `discount_usages_discount_id_idx`(`discount_id`),
    INDEX `discount_usages_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_products` (
    `campaign_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`campaign_id`, `product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_discounts` (
    `campaign_id` VARCHAR(36) NOT NULL,
    `discount_id` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`campaign_id`, `discount_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cart_items_variant_id_idx` ON `cart_items`(`variant_id`);

-- CreateIndex
CREATE UNIQUE INDEX `cart_items_cart_id_product_id_variant_id_key` ON `cart_items`(`cart_id`, `product_id`, `variant_id`);

-- CreateIndex
CREATE INDEX `inventory_logs_variant_id_idx` ON `inventory_logs`(`variant_id`);

-- CreateIndex
CREATE INDEX `order_items_variant_id_idx` ON `order_items`(`variant_id`);

-- CreateIndex
CREATE UNIQUE INDEX `order_items_order_id_product_id_variant_id_key` ON `order_items`(`order_id`, `product_id`, `variant_id`);

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_tags` ADD CONSTRAINT `product_tags_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_tags` ADD CONSTRAINT `product_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_discount_id_fkey` FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_price_history` ADD CONSTRAINT `product_price_history_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_price_history` ADD CONSTRAINT `product_price_history_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discount_usages` ADD CONSTRAINT `discount_usages_discount_id_fkey` FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `discount_usages` ADD CONSTRAINT `discount_usages_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_products` ADD CONSTRAINT `campaign_products_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_products` ADD CONSTRAINT `campaign_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_discounts` ADD CONSTRAINT `campaign_discounts_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_discounts` ADD CONSTRAINT `campaign_discounts_discount_id_fkey` FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
