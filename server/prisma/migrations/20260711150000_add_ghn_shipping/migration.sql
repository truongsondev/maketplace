ALTER TABLE `user_addresses`
    ADD COLUMN `ghn_province_id` INTEGER NULL,
    ADD COLUMN `ghn_district_id` INTEGER NULL,
    ADD COLUMN `ghn_ward_code` VARCHAR(20) NULL;

ALTER TABLE `order_shipping_addresses`
    ADD COLUMN `ghn_province_id` INTEGER NULL,
    ADD COLUMN `ghn_district_id` INTEGER NULL,
    ADD COLUMN `ghn_ward_code` VARCHAR(20) NULL;

CREATE TABLE `order_shipments` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `provider` VARCHAR(30) NOT NULL,
    `provider_order_code` VARCHAR(120) NOT NULL,
    `provider_status` VARCHAR(80) NULL,
    `service_id` INTEGER NULL,
    `service_type_id` INTEGER NULL,
    `cod_amount` DECIMAL(12, 2) NULL,
    `external_fee` DECIMAL(12, 2) NULL,
    `raw_create_payload` JSON NULL,
    `raw_create_response` JSON NULL,
    `raw_latest_webhook` JSON NULL,
    `last_webhook_time` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `order_shipments_order_id_key`(`order_id`),
    UNIQUE INDEX `order_shipments_provider_order_code_key`(`provider_order_code`),
    INDEX `order_shipments_provider_provider_status_idx`(`provider`, `provider_status`),
    PRIMARY KEY (`id`),
    CONSTRAINT `order_shipments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
