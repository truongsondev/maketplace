ALTER TABLE `physical_sales`
  ADD COLUMN `customer_name` VARCHAR(255) NULL AFTER `customer_id`;

CREATE INDEX `physical_sales_customer_phone_idx`
  ON `physical_sales`(`customer_phone`);
