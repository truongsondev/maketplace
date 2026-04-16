USE app_db;


-- Seed hierarchical categories (root -> group -> leaf)
-- Idempotent by `slug` (unique). Safe to run multiple times.

SET @now = NOW(3);

-- Root category images (can be replaced with your own CDN/Cloudinary URLs)
SET @root_ao_image_url = 'https://res.cloudinary.com/dcbrinjr6/image/upload/v1775228509/fashionboy_z4kk8z.png';
SET @root_quan_image_url = 'https://res.cloudinary.com/dcbrinjr6/image/upload/v1775814289/quan_drwiwc.jpg';
SET @root_phu_kien_image_url = 'https://res.cloudinary.com/dcbrinjr6/image/upload/v1775814572/pk_iqrvnj.jpg';

-- =====================
-- ROOT CATEGORIES
-- =====================

-- Áo
SELECT id INTO @ao_id FROM categories WHERE slug = 'ao' LIMIT 1;
SET @ao_id = IFNULL(@ao_id, UUID());
INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_id, 'Áo', 'ao', NULL, @root_ao_image_url, NULL, 10, @now, @now)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  image_url = VALUES(image_url),
  parent_id = VALUES(parent_id),
  sort_order = VALUES(sort_order),
  updated_at = @now;
SELECT id INTO @ao_id FROM categories WHERE slug = 'ao' LIMIT 1;

-- Quần
SELECT id INTO @quan_id FROM categories WHERE slug = 'quan' LIMIT 1;
SET @quan_id = IFNULL(@quan_id, UUID());
INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_id, 'Quần', 'quan', NULL, @root_quan_image_url, NULL, 20, @now, @now)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  image_url = VALUES(image_url),
  parent_id = VALUES(parent_id),
  sort_order = VALUES(sort_order),
  updated_at = @now;
SELECT id INTO @quan_id FROM categories WHERE slug = 'quan' LIMIT 1;

-- Phụ kiện
SELECT id INTO @phu_kien_id FROM categories WHERE slug = 'phu-kien' LIMIT 1;
SET @phu_kien_id = IFNULL(@phu_kien_id, UUID());
INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, created_at, updated_at)
VALUES (@phu_kien_id, 'Phụ kiện', 'phu-kien', NULL, @root_phu_kien_image_url, NULL, 30, @now, @now)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  image_url = VALUES(image_url),
  parent_id = VALUES(parent_id),
  sort_order = VALUES(sort_order),
  updated_at = @now;
SELECT id INTO @phu_kien_id FROM categories WHERE slug = 'phu-kien' LIMIT 1;

-- =====================
-- ÁO (groups + leaves)
-- =====================

-- Áo thun cổ tròn
SELECT id INTO @ao_thun_co_tron_id FROM categories WHERE slug = 'ao-thun-co-tron' LIMIT 1;
SET @ao_thun_co_tron_id = IFNULL(@ao_thun_co_tron_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_thun_co_tron_id, 'Áo thun cổ tròn', 'ao-thun-co-tron', @ao_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @ao_thun_co_tron_id FROM categories WHERE slug = 'ao-thun-co-tron' LIMIT 1;

-- Leaves under Áo thun cổ tròn
SELECT id INTO @ao_thun_tay_ngan_id FROM categories WHERE slug = 'ao-thun-tay-ngan' LIMIT 1;
SET @ao_thun_tay_ngan_id = IFNULL(@ao_thun_tay_ngan_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_thun_tay_ngan_id, 'Áo thun tay ngắn', 'ao-thun-tay-ngan', @ao_thun_co_tron_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_thun_tay_dai_id FROM categories WHERE slug = 'ao-thun-tay-dai' LIMIT 1;
SET @ao_thun_tay_dai_id = IFNULL(@ao_thun_tay_dai_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_thun_tay_dai_id, 'Áo thun tay dài', 'ao-thun-tay-dai', @ao_thun_co_tron_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_tank_top_id FROM categories WHERE slug = 'ao-tank-top-ao-ba-lo' LIMIT 1;
SET @ao_tank_top_id = IFNULL(@ao_tank_top_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_tank_top_id, 'Áo tank top (áo ba lỗ)', 'ao-tank-top-ao-ba-lo', @ao_thun_co_tron_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Áo polo
SELECT id INTO @ao_polo_id FROM categories WHERE slug = 'ao-polo' LIMIT 1;
SET @ao_polo_id = IFNULL(@ao_polo_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_polo_id, 'Áo polo', 'ao-polo', @ao_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @ao_polo_id FROM categories WHERE slug = 'ao-polo' LIMIT 1;

SELECT id INTO @ao_polo_tay_ngan_id FROM categories WHERE slug = 'ao-polo-tay-ngan' LIMIT 1;
SET @ao_polo_tay_ngan_id = IFNULL(@ao_polo_tay_ngan_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_polo_tay_ngan_id, 'Áo polo tay ngắn', 'ao-polo-tay-ngan', @ao_polo_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_polo_tay_dai_id FROM categories WHERE slug = 'ao-polo-tay-dai' LIMIT 1;
SET @ao_polo_tay_dai_id = IFNULL(@ao_polo_tay_dai_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_polo_tay_dai_id, 'Áo polo tay dài', 'ao-polo-tay-dai', @ao_polo_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Áo sơ mi
SELECT id INTO @ao_so_mi_id FROM categories WHERE slug = 'ao-so-mi' LIMIT 1;
SET @ao_so_mi_id = IFNULL(@ao_so_mi_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_so_mi_id, 'Áo sơ mi', 'ao-so-mi', @ao_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @ao_so_mi_id FROM categories WHERE slug = 'ao-so-mi' LIMIT 1;

SELECT id INTO @ao_so_mi_tay_ngan_id FROM categories WHERE slug = 'ao-so-mi-tay-ngan' LIMIT 1;
SET @ao_so_mi_tay_ngan_id = IFNULL(@ao_so_mi_tay_ngan_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_so_mi_tay_ngan_id, 'Áo sơ mi tay ngắn', 'ao-so-mi-tay-ngan', @ao_so_mi_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_so_mi_tay_dai_id FROM categories WHERE slug = 'ao-so-mi-tay-dai' LIMIT 1;
SET @ao_so_mi_tay_dai_id = IFNULL(@ao_so_mi_tay_dai_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_so_mi_tay_dai_id, 'Áo sơ mi tay dài', 'ao-so-mi-tay-dai', @ao_so_mi_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_so_mi_khoac_id FROM categories WHERE slug = 'ao-so-mi-khoac' LIMIT 1;
SET @ao_so_mi_khoac_id = IFNULL(@ao_so_mi_khoac_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_so_mi_khoac_id, 'Áo sơ mi khoác', 'ao-so-mi-khoac', @ao_so_mi_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Áo khoác
SELECT id INTO @ao_khoac_id FROM categories WHERE slug = 'ao-khoac' LIMIT 1;
SET @ao_khoac_id = IFNULL(@ao_khoac_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_khoac_id, 'Áo khoác', 'ao-khoac', @ao_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @ao_khoac_id FROM categories WHERE slug = 'ao-khoac' LIMIT 1;

-- Leaves under Áo khoác
SELECT id INTO @ao_khoac_parka_id FROM categories WHERE slug = 'ao-khoac-parka' LIMIT 1;
SET @ao_khoac_parka_id = IFNULL(@ao_khoac_parka_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_khoac_parka_id, 'Áo khoác parka', 'ao-khoac-parka', @ao_khoac_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_khoac_jean_id FROM categories WHERE slug = 'ao-khoac-jean' LIMIT 1;
SET @ao_khoac_jean_id = IFNULL(@ao_khoac_jean_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_khoac_jean_id, 'Áo khoác jean', 'ao-khoac-jean', @ao_khoac_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_khoac_kaki_id FROM categories WHERE slug = 'ao-khoac-kaki' LIMIT 1;
SET @ao_khoac_kaki_id = IFNULL(@ao_khoac_kaki_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_khoac_kaki_id, 'Áo khoác kaki', 'ao-khoac-kaki', @ao_khoac_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_khoac_du_id FROM categories WHERE slug = 'ao-khoac-du' LIMIT 1;
SET @ao_khoac_du_id = IFNULL(@ao_khoac_du_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_khoac_du_id, 'Áo khoác dù', 'ao-khoac-du', @ao_khoac_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_khoac_bomber_id FROM categories WHERE slug = 'ao-khoac-bomber' LIMIT 1;
SET @ao_khoac_bomber_id = IFNULL(@ao_khoac_bomber_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_khoac_bomber_id, 'Áo khoác bomber', 'ao-khoac-bomber', @ao_khoac_id, 50, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_khoac_hoodie_id FROM categories WHERE slug = 'ao-khoac-hoodie' LIMIT 1;
SET @ao_khoac_hoodie_id = IFNULL(@ao_khoac_hoodie_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_khoac_hoodie_id, 'Áo khoác hoodie', 'ao-khoac-hoodie', @ao_khoac_id, 60, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @ao_khoac_the_thao_id FROM categories WHERE slug = 'ao-khoac-the-thao' LIMIT 1;
SET @ao_khoac_the_thao_id = IFNULL(@ao_khoac_the_thao_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@ao_khoac_the_thao_id, 'Áo khoác thể thao', 'ao-khoac-the-thao', @ao_khoac_id, 70, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- =====================
-- QUẦN (groups + leaves)
-- =====================

-- Quần short
SELECT id INTO @quan_short_id FROM categories WHERE slug = 'quan-short' LIMIT 1;
SET @quan_short_id = IFNULL(@quan_short_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_short_id, 'Quần short', 'quan-short', @quan_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @quan_short_id FROM categories WHERE slug = 'quan-short' LIMIT 1;

SELECT id INTO @quan_short_thun_id FROM categories WHERE slug = 'quan-short-thun' LIMIT 1;
SET @quan_short_thun_id = IFNULL(@quan_short_thun_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_short_thun_id, 'Quần short thun', 'quan-short-thun', @quan_short_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_short_du_id FROM categories WHERE slug = 'quan-short-du' LIMIT 1;
SET @quan_short_du_id = IFNULL(@quan_short_du_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_short_du_id, 'Quần short dù', 'quan-short-du', @quan_short_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_short_kaki_id FROM categories WHERE slug = 'quan-short-kaki' LIMIT 1;
SET @quan_short_kaki_id = IFNULL(@quan_short_kaki_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_short_kaki_id, 'Quần short kaki', 'quan-short-kaki', @quan_short_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_short_cargo_id FROM categories WHERE slug = 'quan-short-cargo' LIMIT 1;
SET @quan_short_cargo_id = IFNULL(@quan_short_cargo_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_short_cargo_id, 'Quần short cargo', 'quan-short-cargo', @quan_short_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_short_active_id FROM categories WHERE slug = 'quan-short-active' LIMIT 1;
SET @quan_short_active_id = IFNULL(@quan_short_active_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_short_active_id, 'Quần short active', 'quan-short-active', @quan_short_id, 50, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Quần dài
SELECT id INTO @quan_dai_id FROM categories WHERE slug = 'quan-dai' LIMIT 1;
SET @quan_dai_id = IFNULL(@quan_dai_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_dai_id, 'Quần dài', 'quan-dai', @quan_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @quan_dai_id FROM categories WHERE slug = 'quan-dai' LIMIT 1;

SELECT id INTO @quan_tay_id FROM categories WHERE slug = 'quan-tay' LIMIT 1;
SET @quan_tay_id = IFNULL(@quan_tay_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_tay_id, 'Quần tây', 'quan-tay', @quan_dai_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_jogger_id FROM categories WHERE slug = 'quan-jogger' LIMIT 1;
SET @quan_jogger_id = IFNULL(@quan_jogger_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_jogger_id, 'Quần jogger', 'quan-jogger', @quan_dai_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_kaki_id FROM categories WHERE slug = 'quan-kaki' LIMIT 1;
SET @quan_kaki_id = IFNULL(@quan_kaki_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_kaki_id, 'Quần kaki', 'quan-kaki', @quan_dai_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Quần jeans
SELECT id INTO @quan_jeans_id FROM categories WHERE slug = 'quan-jeans' LIMIT 1;
SET @quan_jeans_id = IFNULL(@quan_jeans_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_jeans_id, 'Quần jeans', 'quan-jeans', @quan_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @quan_jeans_id FROM categories WHERE slug = 'quan-jeans' LIMIT 1;

SELECT id INTO @quan_jeans_slim_fit_id FROM categories WHERE slug = 'quan-jeans-slim-fit' LIMIT 1;
SET @quan_jeans_slim_fit_id = IFNULL(@quan_jeans_slim_fit_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_jeans_slim_fit_id, 'Quần jeans slim fit', 'quan-jeans-slim-fit', @quan_jeans_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_jeans_loose_fit_id FROM categories WHERE slug = 'quan-jeans-loose-fit' LIMIT 1;
SET @quan_jeans_loose_fit_id = IFNULL(@quan_jeans_loose_fit_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_jeans_loose_fit_id, 'Quần jeans loose fit', 'quan-jeans-loose-fit', @quan_jeans_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_jeans_regular_fit_id FROM categories WHERE slug = 'quan-jeans-regular-fit' LIMIT 1;
SET @quan_jeans_regular_fit_id = IFNULL(@quan_jeans_regular_fit_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_jeans_regular_fit_id, 'Quần jeans regular fit', 'quan-jeans-regular-fit', @quan_jeans_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_jeans_jogger_id FROM categories WHERE slug = 'quan-jeans-jogger' LIMIT 1;
SET @quan_jeans_jogger_id = IFNULL(@quan_jeans_jogger_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_jeans_jogger_id, 'Quần jeans jogger', 'quan-jeans-jogger', @quan_jeans_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_jeans_short_id FROM categories WHERE slug = 'quan-jeans-short' LIMIT 1;
SET @quan_jeans_short_id = IFNULL(@quan_jeans_short_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_jeans_short_id, 'Quần jeans short', 'quan-jeans-short', @quan_jeans_id, 50, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Quần lót
SELECT id INTO @quan_lot_id FROM categories WHERE slug = 'quan-lot' LIMIT 1;
SET @quan_lot_id = IFNULL(@quan_lot_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_lot_id, 'Quần lót', 'quan-lot', @quan_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @quan_lot_id FROM categories WHERE slug = 'quan-lot' LIMIT 1;

SELECT id INTO @quan_lot_soi_tu_nhien_id FROM categories WHERE slug = 'quan-lot-soi-tu-nhien' LIMIT 1;
SET @quan_lot_soi_tu_nhien_id = IFNULL(@quan_lot_soi_tu_nhien_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_lot_soi_tu_nhien_id, 'Quần lót sợi tự nhiên', 'quan-lot-soi-tu-nhien', @quan_lot_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_lot_seamless_id FROM categories WHERE slug = 'quan-lot-seamless' LIMIT 1;
SET @quan_lot_seamless_id = IFNULL(@quan_lot_seamless_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_lot_seamless_id, 'Quần lót seamless', 'quan-lot-seamless', @quan_lot_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_lot_lua_bang_id FROM categories WHERE slug = 'quan-lot-lua-bang' LIMIT 1;
SET @quan_lot_lua_bang_id = IFNULL(@quan_lot_lua_bang_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_lot_lua_bang_id, 'Quần lót lụa băng', 'quan-lot-lua-bang', @quan_lot_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

SELECT id INTO @quan_lot_the_thao_id FROM categories WHERE slug = 'quan-lot-the-thao' LIMIT 1;
SET @quan_lot_the_thao_id = IFNULL(@quan_lot_the_thao_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@quan_lot_the_thao_id, 'Quần lót thể thao', 'quan-lot-the-thao', @quan_lot_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- =====================
-- PHỤ KIỆN (groups + leaves)
-- =====================

-- Nón
SELECT id INTO @non_id FROM categories WHERE slug = 'non' LIMIT 1;
SET @non_id = IFNULL(@non_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@non_id, 'Nón', 'non', @phu_kien_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @non_id FROM categories WHERE slug = 'non' LIMIT 1;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Nón dad hat', 'non-dad-hat', @non_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Nón baseball cap', 'non-baseball-cap', @non_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Nón trucker cap', 'non-trucker-cap', @non_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Nón snapback', 'non-snapback', @non_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Nón bucket', 'non-bucket', @non_id, 50, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Nón fitted cap', 'non-fitted-cap', @non_id, 60, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Nón 5 panel cap', 'non-5-panel-cap', @non_id, 70, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Túi đeo chéo và túi xách
SELECT id INTO @tui_id FROM categories WHERE slug = 'tui-deo-cheo-va-tui-xach' LIMIT 1;
SET @tui_id = IFNULL(@tui_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@tui_id, 'Túi đeo chéo và túi xách', 'tui-deo-cheo-va-tui-xach', @phu_kien_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @tui_id FROM categories WHERE slug = 'tui-deo-cheo-va-tui-xach' LIMIT 1;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Túi đeo chéo (cross bag)', 'tui-deo-cheo-cross-bag', @tui_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Túi bao tử (hip sack)', 'tui-bao-tu-hip-sack', @tui_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Túi đeo ngực (sling bag)', 'tui-deo-nguc-sling-bag', @tui_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Túi messenger', 'tui-messenger', @tui_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Túi tote', 'tui-tote', @tui_id, 50, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Túi trống du lịch (travel bag)', 'tui-trong-du-lich-travel-bag', @tui_id, 60, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Balo
SELECT id INTO @balo_id FROM categories WHERE slug = 'balo' LIMIT 1;
SET @balo_id = IFNULL(@balo_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@balo_id, 'Balo', 'balo', @phu_kien_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @balo_id FROM categories WHERE slug = 'balo' LIMIT 1;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Balo essential', 'balo-essential', @balo_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Balo smart', 'balo-smart', @balo_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Balo campus', 'balo-campus', @balo_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Balo camping', 'balo-camping', @balo_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

-- Ví
SELECT id INTO @vi_id FROM categories WHERE slug = 'vi' LIMIT 1;
SET @vi_id = IFNULL(@vi_id, UUID());
INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (@vi_id, 'Ví', 'vi', @phu_kien_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
SELECT id INTO @vi_id FROM categories WHERE slug = 'vi' LIMIT 1;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Ví ngang công sở', 'vi-ngang-cong-so', @vi_id, 10, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Ví đứng công sở', 'vi-dung-cong-so', @vi_id, 20, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Ví canvas', 'vi-canvas', @vi_id, 30, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Ví cầm tay', 'vi-cam-tay', @vi_id, 40, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;

INSERT INTO categories (id, name, slug, parent_id, sort_order, created_at, updated_at)
VALUES (UUID(), 'Ví cardholder', 'vi-cardholder', @vi_id, 50, @now, @now)
ON DUPLICATE KEY UPDATE name = VALUES(name), parent_id = VALUES(parent_id), sort_order = VALUES(sort_order), updated_at = @now;
