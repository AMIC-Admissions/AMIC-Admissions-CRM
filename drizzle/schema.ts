import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Columns use camelCase to match both database fields and generated types.
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

export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const seatCapacities = mysqlTable(
  "seatCapacities",
  {
    id: int("id").autoincrement().primaryKey(),
    school: varchar("school", { length: 120 }).notNull(),
    grade: varchar("grade", { length: 80 }).notNull(),
    capacity: int("capacity").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    schoolGradeIdx: uniqueIndex("seatCapacities_school_grade_idx").on(table.school, table.grade),
  }),
);

export const students = mysqlTable(
  "students",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: varchar("studentId", { length: 64 }).notNull(),
    name: varchar("name", { length: 240 }).notNull(),
    gender: mysqlEnum("gender", ["Male", "Female"]).notNull(),
    nationality: varchar("nationality", { length: 120 }).notNull(),
    school: varchar("school", { length: 120 }).notNull(),
    grade: varchar("grade", { length: 80 }).notNull(),
    status: mysqlEnum("status", ["Registered", "Assessed", "Passed", "Enrolled"]).default("Registered").notNull(),
    registrationDate: timestamp("registrationDate").defaultNow().notNull(),
    paymentStatus: mysqlEnum("paymentStatus", ["Paid", "Pending"]).default("Pending").notNull(),
    paymentMethod: mysqlEnum("paymentMethod", ["Cash", "Tamara", "JeelPay"]).default("Cash").notNull(),
    fileComplete: boolean("fileComplete").default(false).notNull(),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    studentIdIdx: uniqueIndex("students_studentId_idx").on(table.studentId),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;
export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;
export type SeatCapacity = typeof seatCapacities.$inferSelect;
export type InsertSeatCapacity = typeof seatCapacities.$inferInsert;
