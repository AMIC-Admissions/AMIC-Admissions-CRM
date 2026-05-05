import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, date, json } from "drizzle-orm/mysql-core";

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
  section: varchar("section", { length: 10 }).notNull(), // A, B, C, D, E, F, etc.
  capacity: int("capacity").notNull(),
  reservedSeats: int("reservedSeats").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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
  paymentStatus: mysqlEnum("paymentStatus", ["Pending", "Paid"]).default("Pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["Cash", "Tamara", "JeelPay", "Promissory Note"]),

  // TIMESTAMPS
  registrationDate: timestamp("registrationDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

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
  school: varchar("school", { length: 100 }).notNull(), // Kids Gate, AMIS Girls, AMIS Boys
  grade: varchar("grade", { length: 50 }).notNull(), // Pre-KG, KG I, KG II, Grade 1, etc.
  section: varchar("section", { length: 10 }).notNull(), // A, B, C, D, E, F, Mixed
  gender: varchar("gender", { length: 20 }).notNull(), // Female, Male, Mixed
  capacity: int("capacity").notNull(), // Total seats in this section
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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
  studentId: int("student_id").notNull(), // Foreign key to students table
  fieldKey: varchar("field_key", { length: 100 }).notNull(), // Reference to fieldsConfig.fieldKey
  value: text("value"), // The actual value stored as text (can be JSON for complex types)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentDynamicData = typeof studentDynamicData.$inferSelect;
export type InsertStudentDynamicData = typeof studentDynamicData.$inferInsert;
