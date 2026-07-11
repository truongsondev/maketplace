ALTER TABLE `users`
  ADD COLUMN `birthday` DATE NULL;

ALTER TABLE `discounts`
  ADD COLUMN `is_birthday_voucher` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `discount_usages`
  ADD COLUMN `usage_year` INT NULL;

CREATE UNIQUE INDEX `discount_usages_discount_id_user_id_usage_year_key`
  ON `discount_usages`(`discount_id`, `user_id`, `usage_year`);

CREATE TABLE `birthday_voucher_grants` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `discount_id` VARCHAR(36) NOT NULL,
  `year` INT NOT NULL,
  `birthday_date` DATE NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_sent_at` DATETIME(3) NULL,
  `idempotency_key` VARCHAR(120) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `birthday_voucher_grants_user_id_year_key`(`user_id`, `year`),
  UNIQUE INDEX `birthday_voucher_grants_idempotency_key_key`(`idempotency_key`),
  INDEX `birthday_voucher_grants_discount_id_idx`(`discount_id`),
  INDEX `birthday_voucher_grants_birthday_date_idx`(`birthday_date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `birthday_voucher_grants`
  ADD CONSTRAINT `birthday_voucher_grants_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `birthday_voucher_grants`
  ADD CONSTRAINT `birthday_voucher_grants_discount_id_fkey`
  FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `discounts` (
  `id`, `code`, `description`, `type`, `value`, `max_discount`,
  `min_order_amount`, `max_usage`, `user_usage_limit`, `used_count`,
  `start_at`, `end_at`, `is_active`, `is_birthday_voucher`,
  `scope_type`, `include_descendants`, `min_amount_basis`,
  `created_at`, `updated_at`
)
VALUES (
  UUID(), 'BIRTHDAY', 'Voucher sinh nhật hằng năm',
  'FIXED_AMOUNT', 50000.00, NULL,
  NULL, NULL, NULL, 0,
  '2000-01-01 00:00:00.000', '2099-12-31 23:59:59.000',
  TRUE, TRUE, 'ALL_PRODUCTS', FALSE, 'ELIGIBLE_SUBTOTAL',
  CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  `is_birthday_voucher` = TRUE,
  `is_active` = TRUE,
  `updated_at` = CURRENT_TIMESTAMP(3);
