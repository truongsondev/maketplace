CREATE TABLE `order_cancel_requests` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `reason_code` ENUM('NO_LONGER_NEEDED', 'BUY_OTHER_ITEM', 'FOUND_CHEAPER', 'OTHER') NOT NULL,
    `reason_text` VARCHAR(500) NULL,
    `status` ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'REQUESTED',
    `requested_by_user_id` VARCHAR(36) NOT NULL,
    `approved_by_admin_id` VARCHAR(36) NULL,
    `rejected_by_admin_id` VARCHAR(36) NULL,
    `approved_at` DATETIME(3) NULL,
    `rejected_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `rejection_reason` VARCHAR(500) NULL,
    `bank_account_name` VARCHAR(255) NOT NULL,
    `bank_account_number` VARCHAR(50) NOT NULL,
    `bank_name` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `order_cancel_requests_order_id_key`(`order_id`),
    INDEX `order_cancel_requests_status_idx`(`status`),
    INDEX `order_cancel_requests_requested_by_user_id_idx`(`requested_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `order_cancel_requests`
    ADD CONSTRAINT `order_cancel_requests_order_id_fkey`
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
