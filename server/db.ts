import { eq, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, students, seats, seatMaster } from "../drizzle/schema";
import { SEAT_MASTER_DATA } from "./seatMasterData";
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

type SeatMasterRecord = {
  id?: number;
  school: string;
  grade: string;
  section: string;
  gender: string;
  capacity: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type SeatAvailabilityFilter = {
  school?: string;
  grade?: string;
  gender?: string;
};

function normalizeCount(value: unknown): number {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function matchesSeatFilter(seat: SeatMasterRecord, filters: SeatAvailabilityFilter = {}) {
  if (filters.school && seat.school !== filters.school) return false;
  if (filters.grade && seat.grade !== filters.grade) return false;
  if (filters.gender && seat.gender !== "Mixed" && seat.gender !== filters.gender) return false;
  return true;
}

export async function getSeatMasterRecords(db: NonNullable<Awaited<ReturnType<typeof getDb>>>): Promise<SeatMasterRecord[]> {
  try {
    const dbSeats = await db.select().from(seatMaster);
    if (dbSeats.length > 0) {
      return dbSeats;
    }
  } catch (error) {
    console.warn("[SeatMaster] Falling back to bundled seat master data:", error);
  }

  return SEAT_MASTER_DATA;
}

export async function getSeatAvailabilityRows(filters: SeatAvailabilityFilter = {}) {
  const db = await getDb();
  const allSeats = db ? await getSeatMasterRecords(db) : SEAT_MASTER_DATA;
  const filteredSeats = allSeats.filter((seat) => matchesSeatFilter(seat, filters));

  if (!db) {
    return filteredSeats.map((seat) => ({
      ...seat,
      reserved: 0,
      reservedSeats: 0,
      available: seat.capacity,
      occupancyPercent: 0,
    }));
  }

  const rows = [];
  for (const seat of filteredSeats) {
    const reservedCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(
        and(
          eq(students.school, seat.school),
          eq(students.grade, seat.grade),
          eq(students.section, seat.section),
        ),
      );

    const reserved = normalizeCount(reservedCount[0]?.count);
    const available = seat.capacity - reserved;

    rows.push({
      ...seat,
      reserved,
      reservedSeats: reserved,
      available,
      occupancyPercent: seat.capacity > 0 ? Math.round((reserved / seat.capacity) * 100) : 0,
    });
  }

  return rows;
}

export async function getSeatFilterOptions() {
  const db = await getDb();
  const seatsSource = db ? await getSeatMasterRecords(db) : SEAT_MASTER_DATA;
  const schools = new Set<string>();
  const grades = new Set<string>();
  const genders = new Set<string>();

  for (const seat of seatsSource) {
    if (seat.school) schools.add(seat.school);
    if (seat.grade) grades.add(seat.grade);
    if (seat.gender) genders.add(seat.gender);
  }

  if (db) {
    try {
      const studentSchools = await db.selectDistinct({ school: students.school }).from(students);
      const studentGrades = await db.selectDistinct({ grade: students.grade }).from(students);
      studentSchools.forEach((row) => row.school && schools.add(row.school));
      studentGrades.forEach((row) => row.grade && grades.add(row.grade));
    } catch (error) {
      console.warn("[SeatMaster] Could not merge student filter options:", error);
    }
  }

  return {
    schools: Array.from(schools).sort(),
    grades: Array.from(grades).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    genders: Array.from(genders).sort(),
  };
}

/**
 * Seat Allocation Engine
 */

export type SectionAssignmentResult = {
  section: string;
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
  try {
    const availableSections = await getSeatAvailabilityRows({ school, grade, gender });

    if (availableSections.length === 0) {
      return { section: "", success: false, message: "No sections available for this school/grade" };
    }

    const validSections = availableSections.filter((section) => section.available > 0);

    if (validSections.length === 0) {
      return { section: "", success: false, message: `No available sections for ${gender} in ${grade}` };
    }

    const targetSection = validSections.reduce((prev, current) =>
      (prev.reservedSeats ?? 0) <= (current.reservedSeats ?? 0) ? prev : current
    );

    return { section: targetSection.section, success: true, message: "Section assigned successfully" };
  } catch (error) {
    console.error("[Database] Section assignment error:", error);
    return { section: "", success: false, message: "Error assigning section" };
  }
}

/**
 * Check if seat is available for reservation.
 */
export async function isSeatAvailable(school: string, grade: string, section: string): Promise<boolean> {
  try {
    const seatRecord = await getSeatAvailabilityRows({ school, grade });
    return seatRecord.some((seat) => seat.section === section && seat.available > 0);
  } catch (error) {
    console.error("[Database] Seat availability check error:", error);
    return false;
  }
}

/**
 * Reserve a seat for a student.
 */
export async function reserveSeat(school: string, grade: string, section: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;

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
    console.warn("[Database] Legacy seat reservation update skipped:", error);
    return true;
  }
}

/**
 * Release a reserved seat.
 */
export async function releaseSeat(school: string, grade: string, section: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;

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
    console.warn("[Database] Legacy seat release update skipped:", error);
    return true;
  }
}

/**
 * Check if a student should have a seat reserved based on rules.
 */
/**
 * Calculate if a student should have seatReserved = TRUE
 * Based on: studentType = "Re-Registration" / "Enrollment" OR payment progress.
 */
export function shouldReserveSeat(
  studentType: string,
  paymentStatus?: string | null,
  paymentMethod?: string | null,
  firstInstallment?: boolean,
  secondInstallment?: boolean,
  fullPayment?: boolean,
  promissoryNote?: boolean,
  tamara?: boolean,
  jeelPay?: boolean
): boolean {
  if (["Re-Registration", "Enrollment"].includes(studentType)) {
    return true;
  }

  if (paymentStatus === "Paid" || paymentStatus === "Partial") {
    return true;
  }

  const reservingMethods = ["Cash", "Bank Transfer", "Card", "Tamara", "JeelPay", "Promissory Note"];
  if (reservingMethods.includes(paymentMethod || "")) {
    return true;
  }

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
  from?: Date;
  to?: Date;
  school?: string;
  grade?: string;
}) {
  const emptyDashboard = {
    totalStudents: 0,
    registered: 0,
    assessed: 0,
    passed: 0,
    enrolled: 0,
    seatsReserved: 0,
    seatsAvailable: 0,
    dailyRegistrations: [],
    weeklyComparison: { thisWeek: 0, lastWeek: 0, growth: 0 },
    paymentSummary: {
      cash: 0,
      bankTransfer: 0,
      card: 0,
      tamara: 0,
      jeelPay: 0,
      paid: 0,
      partial: 0,
      pending: 0,
    },
    nationalitySummary: { saudi: 0, nonSaudi: 0, total: 0 },
    nationalityBySchool: [],
    seatUtilization: { bySchool: [], byGrade: [], bySection: [] },
  };

  const db = await getDb();
  if (!db) {
    return emptyDashboard;
  }

  try {
    const startDate = filters.startDate ?? filters.from;
    const endDate = filters.endDate ?? filters.to;
    const conditions = [];
    if (startDate) conditions.push(gte(students.registrationDate, startDate));
    if (endDate) conditions.push(lte(students.registrationDate, endDate));
    if (filters.school) conditions.push(eq(students.school, filters.school));
    if (filters.grade) conditions.push(eq(students.grade, filters.grade));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allStudents = await db.select().from(students).where(whereClause);
    const totalStudents = allStudents.length;
    const registered = allStudents.filter((student) => student.status === "Registered").length;
    const assessed = allStudents.filter((student) => student.status === "Assessed").length;
    const passed = allStudents.filter((student) => student.status === "Passed").length;
    const enrolled = allStudents.filter((student) => student.status === "Enrolled").length;

    const seatRows = await getSeatAvailabilityRows({ school: filters.school, grade: filters.grade });
    const totalCapacity = seatRows.reduce((sum, seat) => sum + (seat.capacity || 0), 0);
    const seatsReserved = seatRows.reduce((sum, seat) => sum + (seat.reserved || 0), 0);
    const seatsAvailable = totalCapacity - seatsReserved;

    const dailyMap = new Map<string, number>();
    for (const student of allStudents) {
      const date = new Date(student.registrationDate).toISOString().slice(0, 10);
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    }
    const dailyRegistrations = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = allStudents.filter((student) => new Date(student.registrationDate) >= weekAgo).length;
    const lastWeek = allStudents.filter((student) => {
      const registrationDate = new Date(student.registrationDate);
      return registrationDate >= twoWeeksAgo && registrationDate < weekAgo;
    }).length;
    const growth = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

    const paymentSummary = {
      cash: allStudents.filter((student) => student.paymentMethod === "Cash").length,
      bankTransfer: allStudents.filter((student) => student.paymentMethod === "Bank Transfer").length,
      card: allStudents.filter((student) => student.paymentMethod === "Card").length,
      tamara: allStudents.filter((student) => student.paymentMethod === "Tamara").length,
      jeelPay: allStudents.filter((student) => student.paymentMethod === "JeelPay").length,
      paid: allStudents.filter((student) => student.paymentStatus === "Paid").length,
      partial: allStudents.filter((student) => student.paymentStatus === "Partial").length,
      pending: allStudents.filter((student) => student.paymentStatus === "Pending").length,
    };

    const saudi = allStudents.filter((student) => student.nationality === "Saudi").length;
    const nonSaudi = allStudents.filter((student) => student.nationality === "Non-Saudi").length;

    const nationalityBySchool: { school: string; saudi: number; nonSaudi: number }[] = [];
    for (const student of allStudents) {
      let entry = nationalityBySchool.find((row) => row.school === student.school);
      if (!entry) {
        entry = { school: student.school, saudi: 0, nonSaudi: 0 };
        nationalityBySchool.push(entry);
      }
      if (student.nationality === "Saudi") entry.saudi += 1;
      else entry.nonSaudi += 1;
    }

    const studentsBySchool = new Map<string, any>();
    for (const student of allStudents) {
      const current = studentsBySchool.get(student.school) ?? {
        school: student.school,
        assessed: 0,
        passed: 0,
        registered: 0,
        seatsReserved: 0,
        paymentMethods: new Set<string>(),
      };
      if (student.status === "Assessed") current.assessed++;
      if (student.status === "Passed") current.passed++;
      if (student.status === "Registered") current.registered++;
      if (student.paymentMethod) current.paymentMethods.add(student.paymentMethod);
      studentsBySchool.set(student.school, current);
    }

    const bySchoolMap = new Map<string, any>();
    const byGradeMap = new Map<string, any>();

    for (const seat of seatRows) {
      const schoolRow = bySchoolMap.get(seat.school) ?? {
        school: seat.school,
        capacity: 0,
        reserved: 0,
        available: 0,
        seatsReserved: 0,
        assessed: studentsBySchool.get(seat.school)?.assessed ?? 0,
        passed: studentsBySchool.get(seat.school)?.passed ?? 0,
        registered: studentsBySchool.get(seat.school)?.registered ?? 0,
        paymentMethods: Array.from(studentsBySchool.get(seat.school)?.paymentMethods ?? []),
      };
      schoolRow.capacity += seat.capacity || 0;
      schoolRow.reserved += seat.reserved || 0;
      schoolRow.available += seat.available || 0;
      schoolRow.seatsReserved += seat.reserved || 0;
      bySchoolMap.set(seat.school, schoolRow);

      const gradeRow = byGradeMap.get(seat.grade) ?? {
        school: filters.school || "All",
        grade: seat.grade,
        capacity: 0,
        reserved: 0,
        available: 0,
      };
      gradeRow.capacity += seat.capacity || 0;
      gradeRow.reserved += seat.reserved || 0;
      gradeRow.available += seat.available || 0;
      byGradeMap.set(seat.grade, gradeRow);
    }

    const bySection = seatRows
      .map((seat) => ({
        school: seat.school,
        grade: seat.grade,
        section: seat.section,
        gender: seat.gender,
        capacity: seat.capacity,
        reserved: seat.reserved,
        available: seat.available,
        occupancyPercent: seat.occupancyPercent,
      }))
      .sort((a, b) => `${a.school}-${a.grade}-${a.section}`.localeCompare(`${b.school}-${b.grade}-${b.section}`, undefined, { numeric: true }));

    return {
      totalStudents,
      registered,
      assessed,
      passed,
      enrolled,
      seatsReserved,
      seatsAvailable,
      dailyRegistrations,
      weeklyComparison: { thisWeek, lastWeek, growth },
      paymentSummary,
      nationalitySummary: { saudi, nonSaudi, total: saudi + nonSaudi },
      nationalityBySchool,
      seatUtilization: {
        bySchool: Array.from(bySchoolMap.values()),
        byGrade: Array.from(byGradeMap.values()),
        bySection,
      },
    };
  } catch (error) {
    console.error("[Dashboard] Query error (using fallback data):", error instanceof Error ? error.message : error);
    return emptyDashboard;
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
