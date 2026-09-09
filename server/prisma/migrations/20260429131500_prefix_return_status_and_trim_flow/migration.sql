-- Rename Return.status enum values to RT_* and keep existing data.
ALTER TABLE `returns`
  MODIFY `status` ENUM(
    'REQUESTED',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
    'RT_REQUESTED',
    'RT_APPROVED',
    'RT_SHIPPING',
    'RT_COMPLETED',
    'RT_REJECTED'
  ) NOT NULL DEFAULT 'REQUESTED';

UPDATE `returns`
SET `status` = CASE `status`
  WHEN 'REQUESTED' THEN 'RT_REQUESTED'
  WHEN 'APPROVED' THEN 'RT_APPROVED'
  WHEN 'REJECTED' THEN 'RT_REJECTED'
  WHEN 'COMPLETED' THEN 'RT_COMPLETED'
  ELSE `status`
END;

ALTER TABLE `returns`
  MODIFY `status` ENUM(
    'RT_REQUESTED',
    'RT_APPROVED',
    'RT_SHIPPING',
    'RT_COMPLETED',
    'RT_REJECTED'
  ) NOT NULL DEFAULT 'RT_REQUESTED';

-- Keep Order.return_status as the order-level return flow requested by the spec.
ALTER TABLE `orders`
  MODIFY `return_status` ENUM(
    'REQUESTED',
    'APPROVED',
    'WAITING_PICKUP',
    'SHIPPING',
    'RETURNING',
    'COMPLETED',
    'REJECTED'
  ) NULL;

UPDATE `orders`
SET `return_status` = CASE `return_status`
  WHEN 'WAITING_PICKUP' THEN 'APPROVED'
  WHEN 'RETURNING' THEN 'SHIPPING'
  ELSE `return_status`
END;

ALTER TABLE `orders`
  MODIFY `return_status` ENUM(
    'REQUESTED',
    'APPROVED',
    'SHIPPING',
    'COMPLETED',
    'REJECTED'
  ) NULL;
