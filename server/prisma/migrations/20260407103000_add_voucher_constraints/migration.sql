-- AlterTable
ALTER TABLE `discounts`
  ADD COLUMN `max_discount` DECIMAL(10,2) NULL,
  ADD COLUMN `user_usage_limit` INTEGER NULL,
  ADD COLUMN `banner_image_url` VARCHAR(1000) NULL;

-- CreateIndex
CREATE INDEX `discounts_is_active_start_at_end_at_idx`
  ON `discounts`(`is_active`, `start_at`, `end_at`);
