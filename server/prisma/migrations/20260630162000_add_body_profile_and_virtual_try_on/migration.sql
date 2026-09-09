ALTER TABLE `users`
  ADD COLUMN `age` INTEGER NULL,
  ADD COLUMN `height_cm` DECIMAL(5, 2) NULL,
  ADD COLUMN `weight_kg` DECIMAL(5, 2) NULL,
  ADD COLUMN `body_profile_updated_at` DATETIME(3) NULL;

CREATE TABLE `virtual_try_on_requests` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `product_image_url` VARCHAR(1000) NOT NULL,
  `human_image_url` VARCHAR(1000) NOT NULL,
  `output_image_url` VARCHAR(1000) NULL,
  `output_public_id` VARCHAR(255) NULL,
  `provider` VARCHAR(80) NOT NULL DEFAULT 'replicate',
  `model_name` VARCHAR(160) NOT NULL DEFAULT 'cuuupid/idm-vton',
  `provider_job_id` VARCHAR(160) NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'TIMEOUT') NOT NULL DEFAULT 'PENDING',
  `category` VARCHAR(40) NOT NULL,
  `garment_des` VARCHAR(500) NOT NULL,
  `crop` BOOLEAN NOT NULL DEFAULT false,
  `force_dc` BOOLEAN NOT NULL DEFAULT false,
  `mask_only` BOOLEAN NOT NULL DEFAULT false,
  `steps` INTEGER NOT NULL DEFAULT 30,
  `seed` INTEGER NULL,
  `latency_ms` INTEGER NULL,
  `estimated_cost_usd` DECIMAL(10, 4) NULL,
  `error_code` VARCHAR(80) NULL,
  `error_message` VARCHAR(500) NULL,
  `started_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `virtual_try_on_requests_user_id_created_at_idx`
  ON `virtual_try_on_requests`(`user_id`, `created_at`);
CREATE INDEX `virtual_try_on_requests_product_id_idx`
  ON `virtual_try_on_requests`(`product_id`);
CREATE INDEX `virtual_try_on_requests_status_idx`
  ON `virtual_try_on_requests`(`status`);
CREATE INDEX `virtual_try_on_requests_provider_job_id_idx`
  ON `virtual_try_on_requests`(`provider_job_id`);

ALTER TABLE `virtual_try_on_requests`
  ADD CONSTRAINT `virtual_try_on_requests_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `virtual_try_on_requests`
  ADD CONSTRAINT `virtual_try_on_requests_product_id_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
