CREATE TABLE `chat_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `status` ENUM('OPEN', 'QUALIFIED', 'CONTACT_CAPTURED', 'ESCALATED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `channel` VARCHAR(40) NOT NULL DEFAULT 'WEB_WIDGET',
    `guest_token` VARCHAR(100) NULL,
    `lead_name` VARCHAR(120) NULL,
    `lead_phone` VARCHAR(20) NULL,
    `lead_email` VARCHAR(255) NULL,
    `budget_min` DECIMAL(10, 2) NULL,
    `budget_max` DECIMAL(10, 2) NULL,
    `shopper_profile` JSON NULL,
    `last_intent` VARCHAR(80) NULL,
    `last_summary` VARCHAR(500) NULL,
    `last_suggested_product_ids` JSON NULL,
    `last_message_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `chat_sessions_user_id_last_message_at_idx`(`user_id`, `last_message_at`),
    INDEX `chat_sessions_status_last_message_at_idx`(`status`, `last_message_at`),
    INDEX `chat_sessions_lead_phone_idx`(`lead_phone`),
    INDEX `chat_sessions_lead_email_idx`(`lead_email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
    `id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `role` ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_session_id_created_at_idx`(`session_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `chat_sessions`
    ADD CONSTRAINT `chat_sessions_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `chat_messages`
    ADD CONSTRAINT `chat_messages_session_id_fkey`
    FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
