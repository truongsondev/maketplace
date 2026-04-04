/*
  Warnings:

  - You are about to drop the column `parent_id` on the `categories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `categories` DROP FOREIGN KEY `categories_parent_id_fkey`;

-- DropIndex
DROP INDEX `categories_parent_id_idx` ON `categories`;

-- AlterTable
ALTER TABLE `categories` DROP COLUMN `parent_id`;
