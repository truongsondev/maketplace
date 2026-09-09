ALTER TABLE `returns`
    ADD COLUMN `request_type` ENUM('EXCHANGE', 'RETURN_REFUND') NOT NULL DEFAULT 'RETURN_REFUND',
    ADD COLUMN `requested_variant_id` VARCHAR(36) NULL;

CREATE INDEX `returns_request_type_idx` ON `returns`(`request_type`);
CREATE INDEX `returns_requested_variant_id_idx` ON `returns`(`requested_variant_id`);
