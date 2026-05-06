CREATE TABLE `recommendation_events` (
    `id` VARCHAR(36) NOT NULL,
    `event_type` ENUM('VIEW_PRODUCT', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'PURCHASE', 'SEARCH_QUERY', 'FAVORITE_PRODUCT') NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `session_id` VARCHAR(100) NOT NULL,
    `product_id` VARCHAR(36) NULL,
    `order_id` VARCHAR(36) NULL,
    `search_query` VARCHAR(255) NULL,
    `dedupe_key` VARCHAR(120) NOT NULL,
    `source` VARCHAR(100) NULL,
    `placement` VARCHAR(120) NULL,
    `metadata` JSON NULL,
    `occurred_at` DATETIME(3) NOT NULL,
    `processed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `recommendation_events_dedupe_key_key`(`dedupe_key`),
    INDEX `recommendation_events_event_type_occurred_at_idx`(`event_type`, `occurred_at`),
    INDEX `recommendation_events_user_id_occurred_at_idx`(`user_id`, `occurred_at`),
    INDEX `recommendation_events_product_id_occurred_at_idx`(`product_id`, `occurred_at`),
    INDEX `recommendation_events_session_id_occurred_at_idx`(`session_id`, `occurred_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_similarities` (
    `product_id` VARCHAR(36) NOT NULL,
    `related_product_id` VARCHAR(36) NOT NULL,
    `algorithm` VARCHAR(50) NOT NULL,
    `score` DECIMAL(8, 4) NOT NULL,
    `rank` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_similarities_related_product_id_algorithm_score_idx`(`related_product_id`, `algorithm`, `score`),
    INDEX `product_similarities_algorithm_score_idx`(`algorithm`, `score`),
    PRIMARY KEY (`product_id`, `related_product_id`, `algorithm`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `recommendation_caches` (
    `id` VARCHAR(36) NOT NULL,
    `cache_key` VARCHAR(255) NOT NULL,
    `model_kind` ENUM('TRENDING', 'TOP_VIEWED', 'TOP_PURCHASED', 'ITEM_SIMILARITY', 'PERSONALIZED', 'HYBRID', 'SESSION_BASED') NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `product_id` VARCHAR(36) NULL,
    `session_id` VARCHAR(100) NULL,
    `items_json` JSON NOT NULL,
    `metadata` JSON NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recommendation_caches_cache_key_key`(`cache_key`),
    INDEX `recommendation_caches_model_kind_expires_at_idx`(`model_kind`, `expires_at`),
    INDEX `recommendation_caches_user_id_model_kind_idx`(`user_id`, `model_kind`),
    INDEX `recommendation_caches_product_id_model_kind_idx`(`product_id`, `model_kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_embeddings` (
    `product_id` VARCHAR(36) NOT NULL,
    `embedding` JSON NOT NULL,
    `embedding_text` LONGTEXT NULL,
    `model_version` VARCHAR(80) NOT NULL,
    `dimensions` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_embeddings` (
    `user_id` VARCHAR(36) NOT NULL,
    `embedding` JSON NOT NULL,
    `model_version` VARCHAR(80) NOT NULL,
    `dimensions` INTEGER NOT NULL,
    `last_event_at` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `recommendation_experiments` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(80) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(500) NULL,
    `status` VARCHAR(40) NOT NULL,
    `traffic` INTEGER NOT NULL DEFAULT 100,
    `variants` JSON NOT NULL,
    `metadata` JSON NULL,
    `start_at` DATETIME(3) NULL,
    `end_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recommendation_experiments_key_key`(`key`),
    INDEX `recommendation_experiments_status_start_at_end_at_idx`(`status`, `start_at`, `end_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `recommendation_metric_snapshots` (
    `id` VARCHAR(36) NOT NULL,
    `metric_date` DATETIME(3) NOT NULL,
    `metric_name` VARCHAR(120) NOT NULL,
    `metric_value` DECIMAL(14, 4) NOT NULL,
    `dimensions` JSON NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recommendation_metric_snapshots_metric_date_metric_name_idx`(`metric_date`, `metric_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `recommendation_events`
    ADD CONSTRAINT `recommendation_events_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `recommendation_events`
    ADD CONSTRAINT `recommendation_events_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `product_similarities`
    ADD CONSTRAINT `product_similarities_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `product_similarities`
    ADD CONSTRAINT `product_similarities_related_product_id_fkey`
    FOREIGN KEY (`related_product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `recommendation_caches`
    ADD CONSTRAINT `recommendation_caches_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `recommendation_caches`
    ADD CONSTRAINT `recommendation_caches_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `product_embeddings`
    ADD CONSTRAINT `product_embeddings_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_embeddings`
    ADD CONSTRAINT `user_embeddings_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
