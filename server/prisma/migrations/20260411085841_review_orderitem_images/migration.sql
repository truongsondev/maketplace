/*
  Warnings:

  - A unique constraint covering the columns `[user_id,order_item_id]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_user_id_fkey`;

-- DropIndex
DROP INDEX `reviews_user_id_product_id_key` ON `reviews`;

-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `order_item_id` VARCHAR(36) NULL;

-- CreateTable
CREATE TABLE `review_images` (
    `id` VARCHAR(36) NOT NULL,
    `review_id` VARCHAR(36) NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `public_id` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `review_images_review_id_idx`(`review_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `reviews_order_item_id_idx` ON `reviews`(`order_item_id`);

-- CreateIndex
CREATE UNIQUE INDEX `reviews_user_id_order_item_id_key` ON `reviews`(`user_id`, `order_item_id`);

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_images` ADD CONSTRAINT `review_images_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
