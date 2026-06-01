-- ============================================================
-- Migration 0008: report_schedules
-- Stores automated email report configurations.
-- ============================================================

CREATE TABLE `report_schedules` (
  `id`          int AUTO_INCREMENT NOT NULL,
  `name`        varchar(120) NOT NULL,
  `frequency`   enum('daily','weekly') NOT NULL DEFAULT 'daily',
  `day_of_week` tinyint NULL COMMENT '0=Sun … 6=Sat, NULL = every day',
  `hour`        tinyint NOT NULL DEFAULT 7 COMMENT 'UTC hour to send (0-23)',
  `recipients`  json NOT NULL COMMENT 'Array of email strings',
  `report_type` enum('summary','at_risk','school_comparison','full') NOT NULL DEFAULT 'summary',
  `filters`     json NULL COMMENT 'Optional school/grade filter',
  `is_active`   boolean NOT NULL DEFAULT true,
  `last_sent_at` timestamp NULL,
  `created_by`  int NULL,
  `created_at`  timestamp NOT NULL DEFAULT (now()),
  `updated_at`  timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `report_schedules_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_schedules_active` ON `report_schedules` (`is_active`);
CREATE INDEX `idx_schedules_frequency` ON `report_schedules` (`frequency`, `day_of_week`, `hour`);
