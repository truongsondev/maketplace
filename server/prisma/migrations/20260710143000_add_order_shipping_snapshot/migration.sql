CREATE TABLE `order_shipping_addresses` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `recipient_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address_line` TEXT NOT NULL,
    `ward` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `source_address_id` VARCHAR(36) NULL,
    `snapshot_source` VARCHAR(40) NOT NULL DEFAULT 'CHECKOUT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `order_shipping_addresses_order_id_key`(`order_id`),
    INDEX `order_shipping_addresses_source_address_id_idx`(`source_address_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `order_shipping_addresses`
    ADD CONSTRAINT `order_shipping_addresses_order_id_fkey`
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Legacy orders never stored an immutable shipping snapshot. Copy the current
-- default/latest profile address only when one exists and mark it explicitly as
-- a legacy backfill so consumers do not mistake it for historically exact data.
INSERT INTO `order_shipping_addresses` (
    `id`,
    `order_id`,
    `recipient_name`,
    `phone`,
    `address_line`,
    `ward`,
    `district`,
    `city`,
    `source_address_id`,
    `snapshot_source`,
    `created_at`
)
SELECT
    UUID(),
    o.`id`,
    ua.`recipient`,
    ua.`phone`,
    ua.`address_line`,
    ua.`ward`,
    ua.`district`,
    ua.`city`,
    ua.`id`,
    'LEGACY_PROFILE_BACKFILL',
    CURRENT_TIMESTAMP(3)
FROM `orders` o
INNER JOIN `user_addresses` ua
    ON ua.`id` = (
        SELECT ua2.`id`
        FROM `user_addresses` ua2
        WHERE ua2.`user_id` = o.`user_id`
        ORDER BY ua2.`is_default` DESC, ua2.`created_at` DESC
        LIMIT 1
    );
