/*
  Warnings:

  - You are about to drop the column `shop_id` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `shops` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_shop_id_fkey`;

-- DropForeignKey
ALTER TABLE `shops` DROP FOREIGN KEY `shops_owner_id_fkey`;

-- DropIndex
DROP INDEX `products_shop_id_idx` ON `products`;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `shop_id`;

-- DropTable
DROP TABLE `shops`;
