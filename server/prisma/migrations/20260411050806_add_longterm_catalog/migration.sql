/*
  Warnings:

  - A unique constraint covering the columns `[product_id,option_key]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `categories` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `product_categories` ADD COLUMN `is_primary` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sort_order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `product_variants` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `is_default` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `option_key` VARCHAR(500) NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `stock_on_hand` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `max_price` DECIMAL(10, 2) NULL,
    ADD COLUMN `min_price` DECIMAL(10, 2) NULL,
    ADD COLUMN `product_type_id` VARCHAR(36) NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `product_types` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_types_code_key`(`code`),
    INDEX `product_types_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attribute_definitions` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `scope` ENUM('PRODUCT', 'VARIANT') NOT NULL,
    `data_type` ENUM('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'MULTI_SELECT') NOT NULL,
    `unit` VARCHAR(50) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attribute_definitions_code_key`(`code`),
    INDEX `attribute_definitions_scope_data_type_idx`(`scope`, `data_type`),
    INDEX `attribute_definitions_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attribute_options` (
    `id` VARCHAR(36) NOT NULL,
    `attribute_id` VARCHAR(36) NOT NULL,
    `value` VARCHAR(100) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `swatch_hex` VARCHAR(16) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attribute_options_attribute_id_sort_order_idx`(`attribute_id`, `sort_order`),
    INDEX `attribute_options_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `attribute_options_attribute_id_value_key`(`attribute_id`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_type_attributes` (
    `product_type_id` VARCHAR(36) NOT NULL,
    `attribute_id` VARCHAR(36) NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `is_filterable` BOOLEAN NOT NULL DEFAULT false,
    `is_variant_axis` BOOLEAN NOT NULL DEFAULT false,
    `variant_axis_order` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_type_attributes_product_type_id_is_variant_axis_vari_idx`(`product_type_id`, `is_variant_axis`, `variant_axis_order`),
    PRIMARY KEY (`product_type_id`, `attribute_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_attribute_values` (
    `id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `attribute_id` VARCHAR(36) NOT NULL,
    `text_value` TEXT NULL,
    `number_value` DECIMAL(18, 4) NULL,
    `boolean_value` BOOLEAN NULL,
    `date_value` DATETIME(3) NULL,
    `option_id` VARCHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_attribute_values_attribute_id_option_id_idx`(`attribute_id`, `option_id`),
    INDEX `product_attribute_values_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `product_attribute_values_product_id_attribute_id_key`(`product_id`, `attribute_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_attribute_value_options` (
    `product_attribute_value_id` VARCHAR(36) NOT NULL,
    `option_id` VARCHAR(36) NOT NULL,

    INDEX `product_attribute_value_options_option_id_idx`(`option_id`),
    PRIMARY KEY (`product_attribute_value_id`, `option_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variant_attribute_values` (
    `id` VARCHAR(36) NOT NULL,
    `variant_id` VARCHAR(36) NOT NULL,
    `attribute_id` VARCHAR(36) NOT NULL,
    `text_value` TEXT NULL,
    `number_value` DECIMAL(18, 4) NULL,
    `boolean_value` BOOLEAN NULL,
    `date_value` DATETIME(3) NULL,
    `option_id` VARCHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `variant_attribute_values_attribute_id_option_id_idx`(`attribute_id`, `option_id`),
    INDEX `variant_attribute_values_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `variant_attribute_values_variant_id_attribute_id_key`(`variant_id`, `attribute_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variant_attribute_value_options` (
    `variant_attribute_value_id` VARCHAR(36) NOT NULL,
    `option_id` VARCHAR(36) NOT NULL,

    INDEX `variant_attribute_value_options_option_id_idx`(`option_id`),
    PRIMARY KEY (`variant_attribute_value_id`, `option_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `categories_deleted_at_idx` ON `categories`(`deleted_at`);

-- CreateIndex
CREATE INDEX `product_categories_category_id_is_primary_sort_order_idx` ON `product_categories`(`category_id`, `is_primary`, `sort_order`);

-- CreateIndex
CREATE INDEX `product_variants_product_id_status_idx` ON `product_variants`(`product_id`, `status`);

-- CreateIndex
CREATE INDEX `product_variants_deleted_at_idx` ON `product_variants`(`deleted_at`);

-- CreateIndex
CREATE UNIQUE INDEX `product_variants_product_id_option_key_key` ON `product_variants`(`product_id`, `option_key`);

-- CreateIndex
CREATE INDEX `products_product_type_id_status_idx` ON `products`(`product_type_id`, `status`);

-- CreateIndex
CREATE INDEX `products_deleted_at_idx` ON `products`(`deleted_at`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_product_type_id_fkey` FOREIGN KEY (`product_type_id`) REFERENCES `product_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attribute_options` ADD CONSTRAINT `attribute_options_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `attribute_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_type_attributes` ADD CONSTRAINT `product_type_attributes_product_type_id_fkey` FOREIGN KEY (`product_type_id`) REFERENCES `product_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_type_attributes` ADD CONSTRAINT `product_type_attributes_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `attribute_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_attribute_values` ADD CONSTRAINT `product_attribute_values_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_attribute_values` ADD CONSTRAINT `product_attribute_values_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `attribute_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_attribute_values` ADD CONSTRAINT `product_attribute_values_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `attribute_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_attribute_value_options` ADD CONSTRAINT `product_attribute_value_options_product_attribute_value_id_fkey` FOREIGN KEY (`product_attribute_value_id`) REFERENCES `product_attribute_values`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_attribute_value_options` ADD CONSTRAINT `product_attribute_value_options_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `attribute_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attribute_values` ADD CONSTRAINT `variant_attribute_values_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attribute_values` ADD CONSTRAINT `variant_attribute_values_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `attribute_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attribute_values` ADD CONSTRAINT `variant_attribute_values_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `attribute_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attribute_value_options` ADD CONSTRAINT `variant_attribute_value_options_variant_attribute_value_id_fkey` FOREIGN KEY (`variant_attribute_value_id`) REFERENCES `variant_attribute_values`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attribute_value_options` ADD CONSTRAINT `variant_attribute_value_options_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `attribute_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
