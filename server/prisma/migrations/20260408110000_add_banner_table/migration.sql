CREATE TABLE `banners` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `description` VARCHAR(500) NULL,
  `image_url` VARCHAR(1000) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
);

CREATE INDEX `banners_is_active_sort_order_idx`
  ON `banners`(`is_active`, `sort_order`);
