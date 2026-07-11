CREATE TABLE `loyalty_accounts` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `tier` VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `loyalty_accounts_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `loyalty_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `account_id` VARCHAR(36) NOT NULL,
    `type` ENUM('EARN', 'REDEEM', 'REVERSE', 'ADJUST', 'EXPIRE') NOT NULL,
    `points` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_id` VARCHAR(36) NULL,
    `idempotency_key` VARCHAR(120) NOT NULL,
    `description` VARCHAR(255) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `loyalty_transactions_idempotency_key_key`(`idempotency_key`),
    INDEX `loyalty_transactions_account_id_created_at_idx`(`account_id`, `created_at`),
    INDEX `loyalty_transactions_reference_type_reference_id_idx`(`reference_type`, `reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `loyalty_config` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `spend_per_point` INTEGER NOT NULL DEFAULT 10000,
    `point_validity_days` INTEGER NOT NULL DEFAULT 365,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `loyalty_accounts`
    ADD CONSTRAINT `loyalty_accounts_user_id_fkey` FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `loyalty_transactions`
    ADD CONSTRAINT `loyalty_transactions_account_id_fkey` FOREIGN KEY (`account_id`)
    REFERENCES `loyalty_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `loyalty_config` (`id`, `spend_per_point`, `point_validity_days`, `is_active`, `updated_at`)
VALUES (1, 10000, 365, true, CURRENT_TIMESTAMP(3));
