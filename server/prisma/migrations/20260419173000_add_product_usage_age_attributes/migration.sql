-- Seed product-level attributes for usage occasion and target age group.
-- Safe to run multiple times because inserts use NOT EXISTS checks.

INSERT INTO `attribute_definitions` (
  `id`,
  `code`,
  `name`,
  `scope`,
  `data_type`,
  `unit`,
  `deleted_at`,
  `created_at`,
  `updated_at`
)
SELECT
  UUID(),
  'usage_occasions',
  'Muc dich su dung',
  'PRODUCT',
  'MULTI_SELECT',
  NULL,
  NULL,
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `attribute_definitions` WHERE `code` = 'usage_occasions'
);

INSERT INTO `attribute_definitions` (
  `id`,
  `code`,
  `name`,
  `scope`,
  `data_type`,
  `unit`,
  `deleted_at`,
  `created_at`,
  `updated_at`
)
SELECT
  UUID(),
  'target_age_group',
  'Do tuoi phu hop',
  'PRODUCT',
  'SELECT',
  NULL,
  NULL,
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `attribute_definitions` WHERE `code` = 'target_age_group'
);

INSERT INTO `attribute_options` (
  `id`,
  `attribute_id`,
  `value`,
  `label`,
  `sort_order`,
  `swatch_hex`,
  `deleted_at`,
  `created_at`,
  `updated_at`
)
SELECT
  UUID(),
  ad.`id`,
  src.`value`,
  src.`label`,
  src.`sort_order`,
  NULL,
  NULL,
  NOW(3),
  NOW(3)
FROM (
  SELECT 'usage_occasions' AS `attribute_code`, 'di_lam' AS `value`, 'Di lam' AS `label`, 1 AS `sort_order`
  UNION ALL SELECT 'usage_occasions', 'di_choi', 'Di choi', 2
  UNION ALL SELECT 'usage_occasions', 'tap_the_thao', 'Tap the thao', 3
  UNION ALL SELECT 'usage_occasions', 'o_nha', 'O nha', 4
  UNION ALL SELECT 'target_age_group', '10_15', '10-15', 1
  UNION ALL SELECT 'target_age_group', '16_25', '16-25', 2
  UNION ALL SELECT 'target_age_group', '25_30', '25-30', 3
  UNION ALL SELECT 'target_age_group', 'gt_30', '>30', 4
) AS src
JOIN `attribute_definitions` ad
  ON ad.`code` = src.`attribute_code`
WHERE NOT EXISTS (
  SELECT 1
  FROM `attribute_options` ao
  WHERE ao.`attribute_id` = ad.`id`
    AND ao.`value` = src.`value`
);

INSERT INTO `product_type_attributes` (
  `product_type_id`,
  `attribute_id`,
  `is_required`,
  `is_filterable`,
  `is_variant_axis`,
  `variant_axis_order`,
  `created_at`,
  `updated_at`
)
SELECT
  pt.`id`,
  ad.`id`,
  CASE WHEN ad.`code` = 'usage_occasions' THEN true ELSE false END,
  true,
  false,
  NULL,
  NOW(3),
  NOW(3)
FROM `product_types` pt
JOIN `attribute_definitions` ad
  ON ad.`code` IN ('usage_occasions', 'target_age_group')
WHERE pt.`deleted_at` IS NULL
  AND ad.`deleted_at` IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `product_type_attributes` pta
    WHERE pta.`product_type_id` = pt.`id`
      AND pta.`attribute_id` = ad.`id`
  );
