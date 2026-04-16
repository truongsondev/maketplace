CREATE TABLE `refund_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `type` ENUM('CANCEL_REFUND', 'RETURN_REFUND') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'VND',
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'RETRYING') NOT NULL DEFAULT 'PENDING',
    `provider` VARCHAR(50) NULL,
    `provider_refund_id` VARCHAR(100) NULL,
    `reason` TEXT NULL,
    `initiated_by` ENUM('ADMIN', 'USER', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    `idempotency_key` VARCHAR(120) NOT NULL,
    `failure_reason` VARCHAR(500) NULL,
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refund_transactions_provider_refund_id_key`(`provider_refund_id`),
    UNIQUE INDEX `refund_transactions_idempotency_key_key`(`idempotency_key`),
    UNIQUE INDEX `refund_transactions_order_id_type_key`(`order_id`, `type`),
    INDEX `refund_transactions_order_id_idx`(`order_id`),
    INDEX `refund_transactions_status_idx`(`status`),
    INDEX `refund_transactions_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `refund_transactions`
    ADD CONSTRAINT `refund_transactions_order_id_fkey`
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
