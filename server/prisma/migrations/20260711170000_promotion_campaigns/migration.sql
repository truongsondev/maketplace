ALTER TABLE `promotions`
  MODIFY COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

UPDATE `promotions` SET `status` = 'ENDED' WHERE `status` = 'EXPIRED';

ALTER TABLE `promotions`
  MODIFY COLUMN `status` ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED') NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `slug` VARCHAR(255) NULL AFTER `name`,
  ADD COLUMN `title` VARCHAR(255) NULL AFTER `slug`,
  ADD COLUMN `subtitle` VARCHAR(255) NULL AFTER `title`,
  MODIFY COLUMN `description` TEXT NULL,
  ADD COLUMN `banner_image_url` VARCHAR(1000) NULL,
  ADD COLUMN `mobile_banner_image_url` VARCHAR(1000) NULL,
  ADD COLUMN `campaign_type` ENUM('FLASH_SALE', 'HOLIDAY', 'CUSTOMER_APPRECIATION', 'SEASONAL', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
  ADD COLUMN `display_priority` INT NOT NULL DEFAULT 0,
  ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `cta_label` VARCHAR(100) NULL,
  ADD COLUMN `cta_url` VARCHAR(1000) NULL,
  ADD COLUMN `member_tiers` JSON NULL;

UPDATE `promotions`
SET `slug` = LOWER(REPLACE(CONCAT(`name`, '-', LEFT(`id`, 8)), ' ', '-')),
    `title` = `name`
WHERE `slug` IS NULL OR `title` IS NULL;

ALTER TABLE `promotions`
  MODIFY COLUMN `slug` VARCHAR(255) NOT NULL,
  MODIFY COLUMN `title` VARCHAR(255) NOT NULL,
  ADD UNIQUE INDEX `promotions_slug_key` (`slug`),
  ADD INDEX `promotions_is_featured_display_priority_idx` (`is_featured`, `display_priority`);

ALTER TABLE `promotions`
  MODIFY COLUMN `scope_type` ENUM('ALL_PRODUCTS', 'INCLUDE_CATEGORIES', 'INCLUDE_PRODUCTS', 'MEMBER_TIERS') NOT NULL DEFAULT 'ALL_PRODUCTS';
