CREATE TABLE `size_chart_rules` (
    `id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NULL,
    `product_type_id` VARCHAR(36) NULL,
    `size_label` VARCHAR(30) NOT NULL,
    `min_height_cm` DECIMAL(5, 2) NULL,
    `max_height_cm` DECIMAL(5, 2) NULL,
    `min_weight_kg` DECIMAL(5, 2) NULL,
    `max_weight_kg` DECIMAL(5, 2) NULL,
    `fit_preference` VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `size_chart_rules_product_id_is_active_idx`(`product_id`, `is_active`),
    INDEX `size_chart_rules_product_type_id_is_active_idx`(`product_type_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `size_chart_rules`
    ADD CONSTRAINT `size_chart_rules_product_id_fkey` FOREIGN KEY (`product_id`)
    REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `size_chart_rules_product_type_id_fkey` FOREIGN KEY (`product_type_id`)
    REFERENCES `product_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
