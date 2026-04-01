-- CreateTable
CREATE TABLE `payment_transactions` (
  `id` VARCHAR(36) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `order_code` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('PENDING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `bank_code` VARCHAR(20) NULL,
  `vnp_transaction_no` VARCHAR(64) NULL,
  `vnp_response_code` VARCHAR(10) NULL,
  `vnp_transaction_status` VARCHAR(10) NULL,
  `paid_at` DATETIME(3) NULL,
  `raw_payload` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `payment_transactions_order_id_key`(`order_id`),
  UNIQUE INDEX `payment_transactions_order_code_key`(`order_code`),
  UNIQUE INDEX `payment_transactions_vnp_transaction_no_key`(`vnp_transaction_no`),
  INDEX `payment_transactions_status_idx`(`status`),
  INDEX `payment_transactions_order_code_idx`(`order_code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `payment_transactions_order_id_fkey`
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
