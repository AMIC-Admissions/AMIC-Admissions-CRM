-- ============================================================
-- Migration 0009: audit_log
-- Records every create / update / delete on student records.
-- ============================================================

CREATE TABLE `audit_log` (
  `id`           int AUTO_INCREMENT NOT NULL,
  `action`       enum('create','update','delete') NOT NULL,
  `student_id`   int NULL          COMMENT 'Null when student was deleted',
  `student_name` varchar(255) NULL COMMENT 'Snapshot at time of action',
  `student_sid`  varchar(50)  NULL COMMENT 'Snapshot of studentId field',
  `performed_by` int NULL          COMMENT 'users.id of the admin',
  `performed_name` varchar(255) NULL,
  `changes`      json NULL         COMMENT '{ field: [before, after] }',
  `snapshot`     json NULL         COMMENT 'Full student record before delete',
  `ip`           varchar(64)  NULL,
  `created_at`   timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_audit_student` ON `audit_log` (`student_id`);
CREATE INDEX `idx_audit_action`  ON `audit_log` (`action`);
CREATE INDEX `idx_audit_user`    ON `audit_log` (`performed_by`);
CREATE INDEX `idx_audit_date`    ON `audit_log` (`created_at`);
