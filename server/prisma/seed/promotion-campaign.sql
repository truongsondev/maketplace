-- Demo campaign. Run after the promotion campaign migration.
INSERT INTO `promotions` (
  `id`, `name`, `slug`, `title`, `subtitle`, `description`, `banner_image_url`,
  `campaign_type`, `status`, `scope_type`, `value`, `priority`, `display_priority`,
  `is_featured`, `stackable_with_voucher`, `start_at`, `end_at`, `created_at`, `updated_at`
) VALUES (
  UUID(), 'Flash Sale Cuoi Tuan', 'flash-sale-cuoi-tuan', 'Flash Sale Cuối Tuần',
  'Giảm 20% toàn bộ sản phẩm trong khung giờ ưu đãi',
  'Ưu đãi được áp dụng tự động, không cần nhập mã.',
  'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1800&q=85',
  'FLASH_SALE', 'ACTIVE', 'ALL_PRODUCTS', 20, 100, 100, TRUE, TRUE,
  NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW()
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();
