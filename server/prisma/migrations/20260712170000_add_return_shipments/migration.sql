CREATE TABLE `return_shipments` (
  `id` VARCHAR(36) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `provider` VARCHAR(30) NOT NULL,
  `provider_order_code` VARCHAR(120) NOT NULL,
  `provider_status` VARCHAR(80) NULL,
  `external_fee` DECIMAL(12, 2) NULL,
  `raw_create_payload` JSON NULL,
  `raw_create_response` JSON NULL,
  `raw_latest_status` JSON NULL,
  `last_synced_at` DATETIME(3) NULL,
  `delivered_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `return_shipments_order_id_key`(`order_id`),
  UNIQUE INDEX `return_shipments_provider_order_code_key`(`provider_order_code`),
  INDEX `return_shipments_provider_provider_status_idx`(`provider`, `provider_status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `return_shipments_order_id_fkey`
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
