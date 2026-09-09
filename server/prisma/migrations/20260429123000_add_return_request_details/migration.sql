ALTER TABLE `returns`
  ADD COLUMN `reason_code` VARCHAR(50) NULL,
  ADD COLUMN `evidence_images` JSON NULL,
  ADD COLUMN `bank_account_name` VARCHAR(255) NULL,
  ADD COLUMN `bank_account_number` VARCHAR(50) NULL,
  ADD COLUMN `bank_name` VARCHAR(120) NULL;

CREATE INDEX `returns_reason_code_idx` ON `returns`(`reason_code`);
