ALTER TABLE `orders`
    ADD COLUMN `subtotal_price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `shipping_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `carrier_name` VARCHAR(120) NULL,
    ADD COLUMN `tracking_code` VARCHAR(120) NULL,
    ADD COLUMN `delivery_note` VARCHAR(500) NULL,
    ADD COLUMN `shipped_at` DATETIME(3) NULL,
    ADD COLUMN `delivered_at` DATETIME(3) NULL;

-- Existing orders did not persist a subtotal snapshot. Since shipping has
-- always been free in this shop, reconstruct subtotal as total + discount.
UPDATE `orders`
SET
    `subtotal_price` = `total_price` + COALESCE(`discount_amount`, 0),
    `shipping_fee` = 0;

-- Recover delivery timestamps from immutable status history where possible.
UPDATE `orders` o
SET o.`delivered_at` = (
    SELECT MAX(osh.`changed_at`)
    FROM `order_status_history` osh
    WHERE osh.`order_id` = o.`id`
      AND osh.`new_status` = 'DELIVERED'
)
WHERE o.`status` IN ('DELIVERED', 'RETURNED');
