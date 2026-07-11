-- Normalize the invariant: available_to_sell = stock_on_hand - stock_reserved.
UPDATE `product_variants`
SET `stock_on_hand` = `stock_available` + `stock_reserved`;

ALTER TABLE `inventory_logs`
    ADD COLUMN `before_quantity` INTEGER NULL,
    ADD COLUMN `after_quantity` INTEGER NULL,
    ADD COLUMN `reference_type` VARCHAR(50) NULL,
    ADD COLUMN `actor_id` VARCHAR(36) NULL,
    ADD COLUMN `reason` VARCHAR(500) NULL,
    ADD COLUMN `sales_channel` ENUM('ONLINE', 'PHYSICAL_STORE', 'INTERNAL') NOT NULL DEFAULT 'INTERNAL';

ALTER TABLE `inventory_logs`
    MODIFY COLUMN `action` ENUM('IMPORT', 'EXPORT', 'RETURN', 'ADJUSTMENT', 'RESERVE', 'RELEASE', 'SALE') NOT NULL;
