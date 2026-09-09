-- Seed additional product-level attributes for richer content, size guide image, and SEO.

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
SELECT UUID(), src.code, src.name, 'PRODUCT', 'TEXT', NULL, NULL, NOW(3), NOW(3)
FROM (
  SELECT 'product_story' AS code, 'Thong tin chi tiet san pham' AS name
  UNION ALL SELECT 'care_instruction', 'Huong dan bao quan'
  UNION ALL SELECT 'fit_note', 'Ghi chu form dang'
  UNION ALL SELECT 'size_guide_image_url', 'Anh huong dan chon size'
  UNION ALL SELECT 'seo_title', 'SEO title'
  UNION ALL SELECT 'seo_description', 'SEO description'
  UNION ALL SELECT 'seo_keywords', 'SEO keywords'
) AS src
WHERE NOT EXISTS (
  SELECT 1 FROM `attribute_definitions` ad WHERE ad.`code` = src.code
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
  false,
  false,
  false,
  NULL,
  NOW(3),
  NOW(3)
FROM `product_types` pt
JOIN `attribute_definitions` ad
  ON ad.`code` IN (
    'product_story',
    'care_instruction',
    'fit_note',
    'size_guide_image_url',
    'seo_title',
    'seo_description',
    'seo_keywords'
  )
WHERE pt.`deleted_at` IS NULL
  AND ad.`deleted_at` IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `product_type_attributes` pta
    WHERE pta.`product_type_id` = pt.`id`
      AND pta.`attribute_id` = ad.`id`
  );
