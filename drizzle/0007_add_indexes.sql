-- ============================================================
-- Migration 0007: Database indexes for search & filter performance
-- ============================================================
--
-- Query analysis (server/routers.ts, db.ts, reports.ts, seatCalculations.ts):
--
-- SINGLE-COLUMN filters used in WHERE:
--   students.school          → listStudents, getDashboard, getAlerts, reports
--   students.grade           → listStudents, getDashboard, getAlerts, reports
--   students.status          → listStudents, getDashboard (count), reports
--   students.seatReserved    → seatCalculations (3×), getAlerts
--   students.fileComplete    → getAlerts, reports
--   students.paymentStatus   → reports, dashboard paymentSummary
--   students.registrationDate → getDashboard (range + GROUP BY daily)
--
-- COMPOSITE filters (always used together):
--   (school, grade, section, seatReserved) → seatCalculations seat-count queries
--   (school, grade)                        → listStudents + dashboard filters
--
-- FULL-TEXT search:
--   name, studentId                        → searchStudents LIKE %query%
--
-- OTHER TABLES:
--   student_dynamic_data(student_id, field_key) → getDynamicFieldValues
--   seat_master(school, grade)                  → getSeatAvailability
-- ============================================================

-- ── students: single-column indexes ──────────────────────────

-- school: most common single filter (listStudents, dashboard, reports)
CREATE INDEX `idx_students_school`
  ON `students` (`school`);

-- grade: second most common single filter
CREATE INDEX `idx_students_grade`
  ON `students` (`grade`);

-- status: used in every dashboard count + report filter
CREATE INDEX `idx_students_status`
  ON `students` (`status`);

-- seatReserved: seatCalculations runs COUNT(*) WHERE seatReserved = true per section
CREATE INDEX `idx_students_seat_reserved`
  ON `students` (`seatReserved`);

-- fileComplete: getAlerts fetches all incomplete files
CREATE INDEX `idx_students_file_complete`
  ON `students` (`fileComplete`);

-- paymentStatus: dashboard payment summary + report filter
CREATE INDEX `idx_students_payment_status`
  ON `students` (`paymentStatus`);

-- registrationDate: getDashboard groups by DATE(registrationDate) and filters by range
CREATE INDEX `idx_students_registration_date`
  ON `students` (`registrationDate`);

-- ── students: composite indexes ───────────────────────────────

-- (school, grade) — most common composite filter pair.
-- Covers listStudents?school=X&grade=Y, dashboard KPI filters,
-- and the outer loop of seatCalculations.
-- Also covers school-only queries (leftmost prefix rule).
CREATE INDEX `idx_students_school_grade`
  ON `students` (`school`, `grade`);

-- (school, grade, section, seatReserved) — exact pattern used in seatCalculations:
--   WHERE school=? AND grade=? AND section=? AND seatReserved=1
-- This composite covers the entire WHERE clause in one index scan,
-- making the per-section COUNT(*) queries essentially O(1).
CREATE INDEX `idx_students_seat_lookup`
  ON `students` (`school`, `grade`, `section`, `seatReserved`);

-- ── students: full-text index for LIKE search ─────────────────

-- searchStudents uses: name LIKE %q% OR studentId LIKE %q%
-- FULLTEXT is faster than LIKE for substring search at 1500+ rows.
-- Falls back gracefully on engines that don't support it.
CREATE FULLTEXT INDEX `idx_students_fulltext`
  ON `students` (`name`, `studentId`);

-- ── student_dynamic_data ──────────────────────────────────────

-- getDynamicFieldValues: WHERE student_id=? AND field_key=?
-- Composite covers both conditions and uniqueness enforcement.
CREATE INDEX `idx_dynamic_data_student_field`
  ON `student_dynamic_data` (`student_id`, `field_key`);

-- ── seat_master ───────────────────────────────────────────────

-- getSeatAvailability loops through seat_master; filters by school + grade.
CREATE INDEX `idx_seat_master_school_grade`
  ON `seat_master` (`school`, `grade`);

-- ── seats (legacy table) ──────────────────────────────────────

-- getSeatAvailability (legacy path) filters by school + grade.
CREATE INDEX `idx_seats_school_grade`
  ON `seats` (`school`, `grade`);
