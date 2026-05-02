/**
 * Report Module Database Helpers
 * Handles dynamic query building and report generation
 */

import { getDb } from "./db";
import { students } from "../drizzle/schema";
import { eq, and, or, sql, SQL, InferSelectModel } from "drizzle-orm";
import { ReportFilter, ReportFieldOption, ReportRow, FIELD_LABELS } from "../shared/reportTypes";
import { TRPCError } from "@trpc/server";

type StudentRow = InferSelectModel<typeof students>;

/**
 * Build WHERE clause conditions based on filters
 */
export function buildFilterConditions(filters: ReportFilter): SQL<unknown>[] {
  const conditions: SQL<unknown>[] = [];

  // Student Filters
  if (filters.school) {
    conditions.push(eq(students.school, filters.school as string));
  }
  if (filters.grade) {
    conditions.push(eq(students.grade, filters.grade as string));
  }
  if (filters.section) {
    conditions.push(eq(students.section, filters.section as string));
  }
  if (filters.gender) {
    conditions.push(eq(students.gender, filters.gender as any));
  }
  if (filters.status) {
    conditions.push(eq(students.status, filters.status as any));
  }
  if (filters.studentType) {
    conditions.push(eq(students.studentType, filters.studentType as any));
  }

  // Academic Filters
  if (filters.assessed !== undefined) {
    if (filters.assessed === true) {
      conditions.push(sql`${students.status} IN ('Assessed', 'Passed', 'Enrolled')`);
    } else if (filters.assessed === false) {
      conditions.push(eq(students.status, "Registered"));
    }
  }
  if (filters.passed !== undefined) {
    if (filters.passed === true) {
      conditions.push(sql`${students.status} IN ('Passed', 'Enrolled')`);
    } else if (filters.passed === false) {
      conditions.push(sql`${students.status} NOT IN ('Passed', 'Enrolled')`);
    }
  }

  // Payment Filters
  if (filters.paymentStatus) {
    conditions.push(eq(students.paymentStatus, filters.paymentStatus as any));
  }
  if (filters.paymentMethod) {
    conditions.push(eq(students.paymentMethod, filters.paymentMethod as any));
  }

  // Seat Filters
  if (filters.seatReserved !== undefined) {
    conditions.push(eq(students.seatReserved, filters.seatReserved as boolean));
  }

  // Document Filters
  if (filters.fileComplete !== undefined) {
    conditions.push(eq(students.fileComplete, filters.fileComplete as boolean));
  }

  return conditions;
}

/**
 * Select specific fields from student record
 */
export function selectReportFields(row: StudentRow, fields: ReportFieldOption[]): ReportRow {
  const result: ReportRow = {};

  fields.forEach((field) => {
    switch (field) {
      case "studentName":
        result[field] = row.name;
        break;
      case "studentId":
        result[field] = row.studentId;
        break;
      case "gender":
        result[field] = row.gender;
        break;
      case "school":
        result[field] = row.school;
        break;
      case "grade":
        result[field] = row.grade;
        break;
      case "section":
        result[field] = row.section;
        break;
      case "status":
        result[field] = row.status;
        break;
      case "studentType":
        result[field] = row.studentType;
        break;
      case "paymentStatus":
        result[field] = row.paymentStatus;
        break;
      case "paymentMethod":
        result[field] = row.paymentMethod;
        break;
      case "seatReserved":
        result[field] = row.seatReserved ? "Yes" : "No";
        break;
      case "fileComplete":
        result[field] = row.fileComplete ? "Yes" : "No";
        break;
      case "nationality":
        result[field] = row.nationality;
        break;
      case "registrationDate":
        result[field] = row.registrationDate?.toISOString().split("T")[0];
        break;
      case "assessed":
        result[field] = ["Assessed", "Passed", "Enrolled"].includes(row.status) ? "Yes" : "No";
        break;
      case "passed":
        result[field] = ["Passed", "Enrolled"].includes(row.status) ? "Yes" : "No";
        break;
      case "parentMobile":
        result[field] = "N/A"; // Not in current schema
        break;
    }
  });

  return result;
}

/**
 * Generate report with dynamic filters and field selection
 */
export async function generateReport(
  filters: ReportFilter,
  selectedFields: ReportFieldOption[],
  limit: number = 1000,
  offset: number = 0
): Promise<{ data: ReportRow[]; total: number }> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  try {
    // Build filter conditions
    const conditions = buildFilterConditions(filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(whereClause);
    const total = countResult[0]?.count ?? 0;

    // Get filtered data
    const rows = await db
      .select()
      .from(students)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Map to selected fields
    const data = rows.map((row) => selectReportFields(row, selectedFields));

    return { data, total };
  } catch (error) {
    console.error("[Reports] Error generating report:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to generate report",
    });
  }
}

/**
 * Get filter options for UI dropdowns
 */
export async function getReportFilterOptions() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  try {
    const schools = await db
      .selectDistinct({ school: students.school })
      .from(students);
    const grades = await db
      .selectDistinct({ grade: students.grade })
      .from(students);
    const sections = await db
      .selectDistinct({ section: students.section })
      .from(students)
      .where(sql`${students.section} IS NOT NULL`);

    return {
      schools: schools.map((s) => s.school).filter(Boolean),
      grades: grades.map((g) => g.grade).filter(Boolean),
      sections: sections.map((s) => s.section).filter(Boolean),
      genders: ["Male", "Female"],
      statuses: ["Registered", "Assessed", "Passed", "Enrolled", "Withdrawn"],
      studentTypes: ["New", "Re-Registration", "Enrollment"],
      paymentStatuses: ["Pending", "Paid"],
      paymentMethods: ["Cash", "Tamara", "JeelPay", "Promissory Note"],
    };
  } catch (error) {
    console.error("[Reports] Error getting filter options:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get filter options",
    });
  }
}
