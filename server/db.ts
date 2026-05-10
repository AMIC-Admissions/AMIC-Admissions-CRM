import { eq, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, students, seats, schools, grades, Student, Seat } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Seat Allocation Engine
 */

export type SectionAssignmentResult = {
  section: string | null;
  success: boolean;
  message: string;
};

/**
 * Auto-assign section based on gender and grade rules.
 * Kindergarten (Pre-KG, KG1, KG2): both genders in same section
 * Grade 1+: Female → A/C/E, Male → B/D/F
 */
export async function assignSection(
  school: string,
  grade: string,
  gender: "Male" | "Female"
): Promise<SectionAssignmentResult> {
  const db = await getDb();
  if (!db) {
    return { section: null, success: false, message: "Database not available" };
  }

  try {
    // Determine if kindergarten
    const isKindergarten = ["Pre-KG", "KG1", "KG2"].includes(grade);
    
    // Get available sections for this school/grade
    const availableSections = await db
      .select()
      .from(seats)
      .where(
        and(
          eq(seats.school, school),
          eq(seats.grade, grade)
        )
      )
      .orderBy(seats.section);

    if (availableSections.length === 0) {
      // Section assignment is optional - return success with NULL section
      return { section: null, success: true, message: "No sections available, student created without section" };
    }

    let validSections: Seat[] = [];

    if (isKindergarten) {
      // Kindergarten: all sections are valid for both genders
      validSections = availableSections;
    } else {
      // Grade 1+: filter by gender
      if (gender === "Female") {
        validSections = availableSections.filter(s => ["A", "C", "E"].includes(s.section));
      } else {
        validSections = availableSections.filter(s => ["B", "D", "F"].includes(s.section));
      }
    }

    if (validSections.length === 0) {
      return { section: null, success: false, message: `No available sections for ${gender} in ${grade}` };
    }

    // Find section with least reserved seats
    const targetSection = validSections.reduce((prev, current) =>
      (prev.reservedSeats ?? 0) < (current.reservedSeats ?? 0) ? prev : current
    );

    return { section: targetSection.section, success: true, message: "Section assigned successfully" };
  } catch (error) {
    console.error("[Database] Section assignment error:", error);
    return { section: null, success: false, message: "Error assigning section" };
  }
}

/**
 * Check if seat is available for reservation.
 */
export async function isSeatAvailable(school: string, grade: string, section: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const seatRecord = await db
      .select()
      .from(seats)
      .where(
        and(
          eq(seats.school, school),
          eq(seats.grade, grade),
          eq(seats.section, section)
        )
      )
      .limit(1);

    if (seatRecord.length === 0) return false;

    const seat = seatRecord[0];
    const available = (seat.capacity ?? 0) - (seat.reservedSeats ?? 0);
    return available > 0;
  } catch (error) {
    console.error("[Database] Seat availability check error:", error);
    return false;
  }
}

/**
 * Reserve a seat for a student.
 */
export async function reserveSeat(school: string, grade: string, section: string | null): Promise<boolean> {
  // If section is NULL, skip reservation (student created without section assignment)
  if (!section) return true;
  
  const db = await getDb();
  if (!db) return false;

  try {
    const available = await isSeatAvailable(school, grade, section);
    if (!available) return false;

    await db
      .update(seats)
      .set({ reservedSeats: sql`reservedSeats + 1` })
      .where(
        and(
          eq(seats.school, school),
          eq(seats.grade, grade),
          eq(seats.section, section)
        )
      );

    return true;
  } catch (error) {
    console.error("[Database] Seat reservation error:", error);
    return false;
  }
}

/**
 * Release a reserved seat.
 */
export async function releaseSeat(school: string, grade: string, section: string | null): Promise<boolean> {
  // If section is NULL, skip release (student was created without section assignment)
  if (!section) return true;
  
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(seats)
      .set({ reservedSeats: sql`GREATEST(0, reservedSeats - 1)` })
      .where(
        and(
          eq(seats.school, school),
          eq(seats.grade, grade),
          eq(seats.section, section)
        )
      );

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a student should have a seat reserved based on rules.
 */
/**
 * Calculate if a student should have seatReserved = TRUE
 * Based on: studentType = "Re-Registration" OR any payment field = TRUE
 */
export function shouldReserveSeat(
  studentType: string,
  paymentStatus?: string,
  paymentMethod?: string | null,
  firstInstallment?: boolean,
  secondInstallment?: boolean,
  fullPayment?: boolean,
  promissoryNote?: boolean,
  tamara?: boolean,
  jeelPay?: boolean
): boolean {
  // Condition 1: Student Type = Re-Registration
  if (studentType === "Re-Registration") {
    return true;
  }

  // Condition 2: Any payment field = TRUE
  if (firstInstallment || secondInstallment || fullPayment || promissoryNote || tamara || jeelPay) {
    return true;
  }

  return false;
}

/**
 * Get dashboard analytics data.
 */
export async function getDashboardData(filters: {
  startDate?: Date;
  endDate?: Date;
  school?: string;
  grade?: string;
}) {
  const db = await getDb();
  if (!db) {
    return {
      totalStudents: 0,
      registered: 0,
      enrolled: 0,
      seatsReserved: 0,
      seatsAvailable: 0,
      dailyRegistrations: [],
      weeklyComparison: { thisWeek: 0, lastWeek: 0, growth: 0 },
      paymentSummary: { cash: 0, tamara: 0, jeelPay: 0, paid: 0, pending: 0 },
      seatUtilization: { bySchool: [], byGrade: [], bySection: [] },
    };
  }

  try {
    const conditions = [];
    if (filters.startDate) conditions.push(gte(students.registrationDate, filters.startDate));
    if (filters.endDate) conditions.push(lte(students.registrationDate, filters.endDate));
    if (filters.school) conditions.push(eq(students.school, filters.school));
    if (filters.grade) conditions.push(eq(students.grade, filters.grade));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total students
    const totalStudentsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(whereClause);
    const totalStudents = totalStudentsResult[0]?.count ?? 0;

    // Registered students
    const registeredResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(whereClause ? and(whereClause, eq(students.status, "Registered")) : eq(students.status, "Registered"));
    const registered = registeredResult[0]?.count ?? 0;

    // Enrolled students
    const enrolledResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(whereClause ? and(whereClause, eq(students.status, "Enrolled")) : eq(students.status, "Enrolled"));
    const enrolled = enrolledResult[0]?.count ?? 0;

    // Seats reserved and available - using seat_master as source of truth
    const { seatMaster } = await import("../drizzle/schema");
    const seatMasterData = await db.select().from(seatMaster);
    
    let totalCapacity = 0;
    let seatsReserved = 0;
    
    for (const seat of seatMasterData) {
      totalCapacity += seat.capacity;
      
      // Count students with seatReserved = TRUE matching this seat
      const reservedCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(students)
        .where(
          and(
            eq(students.school, seat.school),
            eq(students.grade, seat.grade),
            eq(students.section, seat.section),
            eq(students.seatReserved, true)
          )
        );
      
      seatsReserved += reservedCount[0]?.count ?? 0;
    }
    
    const seatsAvailable = totalCapacity - seatsReserved;

    // Daily registrations
    const dailyRegistrations = await db
      .select({
        date: sql<string>`DATE(registrationDate)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(students)
      .where(whereClause)
      .groupBy(sql`DATE(registrationDate)`)
      .orderBy(sql`DATE(registrationDate)`);

    // Weekly comparison
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(
        whereClause
          ? and(whereClause, gte(students.registrationDate, weekAgo))
          : gte(students.registrationDate, weekAgo)
      );
    const thisWeek = thisWeekResult[0]?.count ?? 0;

    const lastWeekResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(
        whereClause
          ? and(whereClause, gte(students.registrationDate, twoWeeksAgo), lte(students.registrationDate, weekAgo))
          : and(gte(students.registrationDate, twoWeeksAgo), lte(students.registrationDate, weekAgo))
      );
    const lastWeek = lastWeekResult[0]?.count ?? 0;
    const growth = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

    // Payment summary
    const paymentSummary = await db
      .select({
        method: students.paymentMethod,
        status: students.paymentStatus,
        count: sql<number>`COUNT(*)`,
      })
      .from(students)
      .where(whereClause)
      .groupBy(students.paymentMethod, students.paymentStatus);

    let cash = 0, tamara = 0, jeelPay = 0, paid = 0, pending = 0;
    paymentSummary.forEach(row => {
      if (row.method === "Cash") cash += row.count;
      if (row.method === "Tamara") tamara += row.count;
      if (row.method === "JeelPay") jeelPay += row.count;
      if (row.status === "Paid") paid += row.count;
      if (row.status === "Pending") pending += row.count;
    });

    // Seat utilization by school
    const bySchool = await db
      .select({
        school: seats.school,
        capacity: sql<number>`SUM(capacity)`,
        reserved: sql<number>`SUM(reservedSeats)`,
      })
      .from(seats)
      .groupBy(seats.school);

    // Seat utilization by grade
    const byGrade = await db
      .select({
        grade: seats.grade,
        capacity: sql<number>`SUM(capacity)`,
        reserved: sql<number>`SUM(reservedSeats)`,
      })
      .from(seats)
      .groupBy(seats.grade);

    // Seat utilization by section
    const bySection = await db
      .select({
        school: seats.school,
        grade: seats.grade,
        section: seats.section,
        capacity: seats.capacity,
        reserved: seats.reservedSeats,
      })
      .from(seats)
      .orderBy(seats.school, seats.grade, seats.section);

    return {
      totalStudents,
      registered,
      enrolled,
      seatsReserved,
      seatsAvailable,
      dailyRegistrations: dailyRegistrations.map(d => ({ date: d.date, count: d.count })),
      weeklyComparison: { thisWeek, lastWeek, growth },
      paymentSummary: { cash, tamara, jeelPay, paid, pending },
      seatUtilization: { bySchool, byGrade, bySection },
    };
  } catch (error) {
    console.error("[Dashboard] Query error (using fallback data):", error instanceof Error ? error.message : error);
    return {
      totalStudents: 0,
      registered: 0,
      enrolled: 0,
      seatsReserved: 0,
      seatsAvailable: 0,
      dailyRegistrations: [],
      weeklyComparison: { thisWeek: 0, lastWeek: 0, growth: 0 },
      paymentSummary: { cash: 0, tamara: 0, jeelPay: 0, paid: 0, pending: 0 },
      seatUtilization: { bySchool: [], byGrade: [], bySection: [] },
    };
  }
}


/**
 * Calculate fileComplete status for a student
 * File is complete only if BOTH docsSigned AND requirementsSubmitted are TRUE
 */
export function calculateFileComplete(docsSigned: boolean, requirementsSubmitted: boolean): boolean {
  return docsSigned && requirementsSubmitted;
}

/**
 * Calculate seatReserved status for a student
 * Seat is reserved when:
 * 1. Student Type is Re-Registration OR Enrollment
 * OR
 * 2. Any payment is completed (firstInstallment, fullPayment, promissoryNote, tamara, jeelPay)
 */
export function calculateSeatReservedNew(
  studentType: string,
  firstInstallment: boolean,
  fullPayment: boolean,
  promissoryNote: boolean,
  tamara: boolean,
  jeelPay: boolean
): boolean {
  // Check if student type qualifies for seat reservation
  const typeQualifies = studentType === "Re-Registration" || studentType === "Enrollment";

  // Check if any payment method is completed
  const paymentCompleted = firstInstallment || fullPayment || promissoryNote || tamara || jeelPay;

  return typeQualifies || paymentCompleted;
}
