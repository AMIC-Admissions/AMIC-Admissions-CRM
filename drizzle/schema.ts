import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, date } from "drizzle-orm/mysql-core";

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
 * Students table for student management.
 * NOTE: This is the OLD schema. After migration is applied, restore from schema-new.ts.backup
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  studentId: varchar("studentId", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  gender: mysqlEnum("gender", ["Male", "Female"]).notNull(),
  nationality: varchar("nationality", { length: 100 }),
  school: varchar("school", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 255 }).notNull(),
  section: varchar("section", { length: 10 }),
  status: mysqlEnum("status", ["Registered", "Assessed", "Passed", "Enrolled", "Withdrawn"]).default("Registered").notNull(),
  registrationDate: timestamp("registrationDate").defaultNow().notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["Pending", "Paid"]).default("Pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["Cash", "Tamara", "JeelPay", "Promissory Note"]),
  studentType: mysqlEnum("studentType", ["New", "Re-Registration", "Enrollment"]).default("New").notNull(),
  fileComplete: boolean("fileComplete").default(false).notNull(),
  seatReserved: boolean("seatReserved").default(false).notNull(),
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
