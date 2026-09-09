INSERT INTO `order_status_history` (`id`, `order_id`, `old_status`, `new_status`, `changed_by`, `reason`, `changed_at`)
SELECT UUID(), o.`id`, o.`status`, 'LOST', NULL, 'Backfill from GHN provider status: lost', NOW()
FROM `orders` o
INNER JOIN `order_shipments` s ON s.`order_id` = o.`id`
WHERE LOWER(s.`provider_status`) = 'lost'
  AND o.`status` <> 'LOST';

UPDATE `orders` o
INNER JOIN `order_shipments` s ON s.`order_id` = o.`id`
SET o.`status` = 'LOST'
WHERE LOWER(s.`provider_status`) = 'lost'
  AND o.`status` <> 'LOST';
