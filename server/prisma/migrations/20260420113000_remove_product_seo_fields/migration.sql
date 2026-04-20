-- Remove SEO-related product attributes and all related values/options/mappings.
DELETE FROM attribute_definitions
WHERE scope = 'PRODUCT'
  AND code IN ('seo_title', 'seo_description', 'seo_keywords');
