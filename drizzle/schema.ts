import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, date, json, index, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Schools table for school management.
 */
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

/**
 * Grades table for grade management.
 */
export const grades = mysqlTable("grades", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  level: int("level").notNull(), // 0 for Pre-KG, 1 for KG1, 2 for KG2, 3+ for Grade 1+
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

/**
 * Seats table for seat capacity and reservation tracking.
 */
export const seats = mysqlTable("seats", {
  id: int("id").autoincrement().primaryKey(),
  school: varchar("school", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 255 }).notNull(),
  section: varchar("section", { length: 10 }).notNull(),
  capacity: int("capacity").notNull(),
  reservedSeats: int("reservedSeats").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  idxSchoolGrade: index("idx_seats_school_grade").on(t.school, t.grade),
}));

export type Seat = typeof seats.$inferSelect;
export type InsertSeat = typeof seats.$inferInsert;

/**
 * Students table for student management with complete AJYAL AL-MAARIFA structure.
 * Migration 0004 has been applied - all fields are now available in the database.
 */
export const students = mysqlTable("students", {
  // Primary ID
  id: int("id").autoincrement().primaryKey(),

  // STUDENT INFORMATION
  studentId: varchar("studentId", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: date("dateOfBirth"),

  // PERSONAL DETAILS
  gender: mysqlEnum("gender", ["Male", "Female"]).notNull(),
  nationality: mysqlEnum("nationality", ["Saudi", "Non-Saudi"]).default("Saudi").notNull(),

  // ENROLLMENT
  school: varchar("school", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 255 }).notNull(),
  section: varchar("section", { length: 10 }),
  studentType: mysqlEnum("studentType", ["New Admission", "Enrollment", "Re-Registration", "Transfer"]).default("New Admission").notNull(),
  dateOfJoin: date("dateOfJoin"),

  // ASSESSMENT
  assessed: boolean("assessed").default(false).notNull(),
  passed: boolean("passed").default(false).notNull(),
  reAssessment: boolean("reAssessment").default(false).notNull(),
  passedRe: boolean("passedRe").default(false).notNull(),

  // STATUS
  registration: boolean("registration").default(false).notNull(),
  enrollment: boolean("enrollment").default(false).notNull(),
  transfer: boolean("transfer").default(false).notNull(),

  // PAYMENT
  firstInstallment: boolean("firstInstallment").default(false).notNull(),
  secondInstallment: boolean("secondInstallment").default(false).notNull(),
  fullPayment: boolean("fullPayment").default(false).notNull(),
  promissoryNote: boolean("promissoryNote").default(false).notNull(),
  tamara: boolean("tamara").default(false).notNull(),
  jeelPay: boolean("jeelPay").default(false).notNull(),

  // DOCUMENTS
  docsSigned: boolean("docsSigned").default(false).notNull(),
  requirementsSubmitted: boolean("requirementsSubmitted").default(false).notNull(),
  fileComplete: boolean("fileComplete").default(false).notNull(),

  // PARENT / GUARDIAN
  fatherId: varchar("fatherId", { length: 50 }),
  fatherMobile: varchar("fatherMobile", { length: 20 }),
  motherId: varchar("motherId", { length: 50 }),
  motherMobile: varchar("motherMobile", { length: 20 }),

  // ADMIN
  seatReserved: boolean("seatReserved").default(false).notNull(),
  notes: text("notes"),

  // LEGACY FIELDS (for backward compatibility)
  status: mysqlEnum("status", ["Registered", "Assessed", "Passed", "Enrolled", "Withdrawn"]).default("Registered").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["Pending", "Partial", "Paid"]).default("Pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["Cash", "Bank Transfer", "Card", "Tamara", "JeelPay", "Promissory Note"]),

  // TIMESTAMPS
  registrationDate: timestamp("registrationDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  // Single-column: most common WHERE filters
  idxSchool:            index("idx_students_school").on(t.school),
  idxGrade:             index("idx_students_grade").on(t.grade),
  idxStatus:            index("idx_students_status").on(t.status),
  idxSeatReserved:      index("idx_students_seat_reserved").on(t.seatReserved),
  idxFileComplete:      index("idx_students_file_complete").on(t.fileComplete),
  idxPaymentStatus:     index("idx_students_payment_status").on(t.paymentStatus),
  idxRegistrationDate:  index("idx_students_registration_date").on(t.registrationDate),

  // Composite: (school, grade) — most common filter pair; also covers school-only
  idxSchoolGrade:       index("idx_students_school_grade").on(t.school, t.grade),

  // Composite: exact pattern used in seatCalculations COUNT(*) per section
  idxSeatLookup:        index("idx_students_seat_lookup").on(t.school, t.grade, t.section, t.seatReserved),
}));

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Audit log — immutable record of every student create/update/delete.
 */
export const auditLog = mysqlTable("audit_log", {
  id:            int("id").autoincrement().primaryKey(),
  action:        mysqlEnum("action", ["create", "update", "delete"]).notNull(),
  studentId:     int("student_id"),
  studentName:   varchar("student_name", { length: 255 }),
  studentSid:    varchar("student_sid",  { length: 50 }),
  performedBy:   int("performed_by"),
  performedName: varchar("performed_name", { length: 255 }),
  changes:       json("changes").$type<Record<string, [unknown, unknown]>>(),
  snapshot:      json("snapshot"),
  ip:            varchar("ip", { length: 64 }),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idxStudent: index("idx_audit_student").on(t.studentId),
  idxAction:  index("idx_audit_action").on(t.action),
  idxUser:    index("idx_audit_user").on(t.performedBy),
  idxDate:    index("idx_audit_date").on(t.createdAt),
}));

export type AuditLogEntry = typeof auditLog.$inferSelect;

/**
 * Report schedules — automated email delivery configuration.
 */
export const reportSchedules = mysqlTable("report_schedules", {
  id:          int("id").autoincrement().primaryKey(),
  name:        varchar("name", { length: 120 }).notNull(),
  frequency:   mysqlEnum("frequency", ["daily", "weekly"]).default("daily").notNull(),
  dayOfWeek:   int("day_of_week"),          // 0=Sun … 6=Sat, null = every day
  hour:        int("hour").default(7).notNull(), // UTC hour 0-23
  recipients:  json("recipients").notNull().$type<string[]>(),
  reportType:  mysqlEnum("report_type", ["summary", "at_risk", "school_comparison", "full"]).default("summary").notNull(),
  filters:     json("filters").$type<{ school?: string; grade?: string }>(),
  isActive:    boolean("is_active").default(true).notNull(),
  lastSentAt:  timestamp("last_sent_at"),
  createdBy:   int("created_by"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  idxActive:    index("idx_schedules_active").on(t.isActive),
  idxFrequency: index("idx_schedules_frequency").on(t.frequency, t.dayOfWeek, t.hour),
}));

export type ReportSchedule = typeof reportSchedules.$inferSelect;

/**
 * Report templates table for saving custom report configurations.
 */
export const reportTemplates = mysqlTable("report_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  filters: text("filters").notNull(), // JSON string
  selectedFields: text("selectedFields").notNull(), // JSON string
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;


/**
 * Seat Master table - Official source of truth for seat structure
 * Contains all seats across all schools, grades, and sections
 */
export const seatMaster = mysqlTable("seat_master", {
  id: int("id").autoincrement().primaryKey(),
  school: varchar("school", { length: 100 }).notNull(),
  grade: varchar("grade", { length: 50 }).notNull(),
  section: varchar("section", { length: 10 }).notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  capacity: int("capacity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  // getSeatAvailability iterates and filters by school+grade
  idxSchoolGrade: index("idx_seat_master_school_grade").on(t.school, t.grade),
}));

export type SeatMaster = typeof seatMaster.$inferSelect;
export type InsertSeatMaster = typeof seatMaster.$inferInsert;


/**
 * Dynamic Fields Configuration Table
 * Stores metadata for dynamic fields that can be added to students
 */
export const fieldsConfig = mysqlTable("fields_config", {
  id: int("id").autoincrement().primaryKey(),
  fieldKey: varchar("field_key", { length: 100 }).notNull().unique(), // e.g., "gender", "nationality", "student_type"
  fieldLabel: varchar("field_label", { length: 255 }).notNull(), // e.g., "Gender", "Nationality"
  fieldType: mysqlEnum("field_type", ["text", "select", "checkbox", "date", "number"]).notNull(), // Field type
  options: json("options").$type<{ label: string; value: string }[]>(), // For select fields: [{label: "Male", value: "Male"}, ...]
  required: boolean("required").default(false).notNull(), // Is this field required?
  section: varchar("section", { length: 100 }).default("general").notNull(), // Form section: general, enrollment, payment, documents, parent
  visible: boolean("visible").default(true).notNull(), // Is this field visible in forms?
  order: int("order").default(0).notNull(), // Display order in forms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldsConfig = typeof fieldsConfig.$inferSelect;
export type InsertFieldsConfig = typeof fieldsConfig.$inferInsert;

/**
 * Student Dynamic Data Table
 * Stores dynamic field values for each student
 */
export const studentDynamicData = mysqlTable("student_dynamic_data", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("student_id").notNull(),
  fieldKey: varchar("field_key", { length: 100 }).notNull(),
  value: text("value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  // getDynamicFieldValues: WHERE student_id=? AND field_key=?
  idxStudentField: index("idx_dynamic_data_student_field").on(t.studentId, t.fieldKey),
}));

export type StudentDynamicData = typeof studentDynamicData.$inferSelect;
export type InsertStudentDynamicData = typeof studentDynamicData.$inferInsert;
