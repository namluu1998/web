-- ===================================================================
--  bunquay_db_setup.sql — Chạy 1 lần trong phpMyAdmin
--  Chọn database bunquay_db trước, rồi Import file này
-- ===================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `settings` (
  `id`   tinyint(1) NOT NULL DEFAULT 1,
  `data` longtext   NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `menu` (
  `id`         varchar(50) NOT NULL,
  `data`       longtext    NOT NULL,
  `sort_order` int         NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `posts` (
  `id`         varchar(50) NOT NULL,
  `data`       longtext    NOT NULL,
  `views`      int         NOT NULL DEFAULT 0,
  `published`  tinyint(1)  NOT NULL DEFAULT 0,
  `created_at` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id`         varchar(50) NOT NULL,
  `data`       longtext    NOT NULL,
  `status`     varchar(20) NOT NULL DEFAULT 'new',
  `created_at` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id`   tinyint(1) NOT NULL DEFAULT 1,
  `data` longtext   NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `faqs` (
  `id`         varchar(50) NOT NULL,
  `data`       longtext    NOT NULL,
  `sort_order` int         NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id`       varchar(50)  NOT NULL,
  `username` varchar(100) NOT NULL,
  `data`     longtext     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
