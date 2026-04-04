-- Add homepage label flags for products
ALTER TABLE `products`
  ADD COLUMN `is_new` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `is_sale` BOOLEAN NOT NULL DEFAULT false;

-- Improve latest products query performance
CREATE INDEX `products_created_at_idx` ON `products`(`created_at`);
