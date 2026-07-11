CREATE TABLE `physical_sales` (
    `id` VARCHAR(36) NOT NULL, `cashier_id` VARCHAR(36) NOT NULL,
    `payment_method` VARCHAR(30) NOT NULL, `total_amount` DECIMAL(10, 2) NOT NULL,
    `note` VARCHAR(500) NULL, `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `physical_sales_created_at_idx`(`created_at`), INDEX `physical_sales_cashier_id_idx`(`cashier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `physical_sale_items` (
    `id` VARCHAR(36) NOT NULL, `sale_id` VARCHAR(36) NOT NULL, `variant_id` VARCHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL, `unit_price` DECIMAL(10, 2) NOT NULL,
    INDEX `physical_sale_items_sale_id_idx`(`sale_id`), INDEX `physical_sale_items_variant_id_idx`(`variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `physical_sale_items`
    ADD CONSTRAINT `physical_sale_items_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `physical_sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `physical_sale_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
