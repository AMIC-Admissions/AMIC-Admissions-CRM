import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertSeatCapacity,
  InsertStudent,
  InsertUser,
  SeatCapacity,
  Student,
  seatCapacities,
  students,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export const STATUS_ORDER = ["Registered", "Assessed", "Passed", "Enrolled"] as const;
export const PAYMENT_METHODS = ["Cash", "Tamara", "JeelPay"] as const;
export const PAYMENT_STATUSES = ["Paid", "Pending"] as const;

export type AdmissionStatus = (typeof STATUS_ORDER)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type StudentFilters = {
  school?: string;
  grade?: string;
  from?: Date;
  to?: Date;
};

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
      values.role = "admin";
      updateSet.role = "admin";
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

export function assertPaymentMethod(method: string): asserts method is PaymentMethod {
  if (!PAYMENT_METHODS.includes(method as PaymentMethod)) {
    throw new Error("Payment method must be Cash, Tamara, or JeelPay.");
  }
}

export function assertValidProgression(current: AdmissionStatus, next: AdmissionStatus) {
  const currentIndex = STATUS_ORDER.indexOf(current);
  const nextIndex = STATUS_ORDER.indexOf(next);
  if (nextIndex !== currentIndex + 1) {
    throw new Error("Admissions status must move exactly one step forward and cannot be skipped or reversed.");
  }
}

export function assertSeatAvailableForEnrollment(availableSeats: number) {
  if (availableSeats <= 0) {
    throw new Error("Enrollment is blocked because no seats are available for this school and grade.");
  }
}

function buildStudentWhere(filters: StudentFilters) {
  const clauses = [];
  if (filters.school) clauses.push(eq(students.school, filters.school));
  if (filters.grade) clauses.push(eq(students.grade, filters.grade));
  if (filters.from) clauses.push(gte(students.registrationDate, filters.from));
  if (filters.to) clauses.push(lte(students.registrationDate, filters.to));
  return clauses.length ? and(...clauses) : undefined;
}

export async function listStudents(filters: StudentFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  const where = buildStudentWhere(filters);
  if (where) {
    return db.select().from(students).where(where).orderBy(desc(students.registrationDate));
  }
  return db.select().from(students).orderBy(desc(students.registrationDate));
}

export async function createStudent(input: InsertStudent) {
  assertPaymentMethod(input.paymentMethod ?? "Cash");
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const [result] = await db.insert(students).values(input).$returningId();
  return result;
}

export async function updateStudent(id: number, input: Partial<Omit<InsertStudent, "id" | "status">>) {
  if (input.paymentMethod) assertPaymentMethod(input.paymentMethod);
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  await db.update(students).set(input).where(eq(students.id, id));
  return getStudent(id);
}

export async function getStudent(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return rows[0];
}

export async function deleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  await db.delete(students).where(eq(students.id, id));
  return { success: true } as const;
}

export async function listSeatCapacities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seatCapacities).orderBy(seatCapacities.school, seatCapacities.grade);
}

export async function upsertSeatCapacity(input: InsertSeatCapacity) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  await db.insert(seatCapacities).values(input).onDuplicateKeyUpdate({
    set: { capacity: input.capacity },
  });
  return listSeatCapacitiesWithUsage();
}

function statusCountsForSeat(allStudents: Student[], seat: SeatCapacity) {
  const related = allStudents.filter((student) => student.school === seat.school && student.grade === seat.grade);
  const registered = related.filter((student) => student.status === "Registered").length;
  const reserved = related.filter((student) => student.status === "Passed" || student.status === "Enrolled").length;
  const available = Math.max(0, seat.capacity - reserved);
  return { registered, reserved, available, lowSeatAlert: available <= 3 };
}

export async function listSeatCapacitiesWithUsage() {
  const [seats, allStudents] = await Promise.all([listSeatCapacities(), listStudents()]);
  return seats.map((seat) => ({
    ...seat,
    ...statusCountsForSeat(allStudents, seat),
  }));
}

export async function getSeatUsage(school: string, grade: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const rows = await db
    .select()
    .from(seatCapacities)
    .where(and(eq(seatCapacities.school, school), eq(seatCapacities.grade, grade)))
    .limit(1);
  const seat = rows[0];
  if (!seat) return { capacity: 0, registered: 0, reserved: 0, available: 0, lowSeatAlert: true };
  const allStudents = await listStudents({ school, grade });
  return { capacity: seat.capacity, ...statusCountsForSeat(allStudents, seat) };
}

export async function updateStudentStatus(id: number, nextStatus: AdmissionStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available.");
  const student = await getStudent(id);
  if (!student) throw new Error("Student was not found.");
  assertValidProgression(student.status as AdmissionStatus, nextStatus);

  if (nextStatus === "Enrolled") {
    const usage = await getSeatUsage(student.school, student.grade);
    assertSeatAvailableForEnrollment(usage.available);
  }

  await db.update(students).set({ status: nextStatus }).where(eq(students.id, id));
  return getStudent(id);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getDashboard(filters: StudentFilters = {}) {
  const [allStudents, seats] = await Promise.all([listStudents(filters), listSeatCapacitiesWithUsage()]);
  const totalStudents = allStudents.length;
  const registered = allStudents.filter((student) => student.status === "Registered").length;
  const enrolled = allStudents.filter((student) => student.status === "Enrolled").length;
  const seatsReserved = seats.reduce((sum, seat) => sum + seat.reserved, 0);
  const seatsAvailable = seats.reduce((sum, seat) => sum + seat.available, 0);

  const today = startOfDay(new Date());
  const dailyRegistrations = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (13 - index));
    const key = toKey(day);
    return {
      date: key,
      count: allStudents.filter((student) => toKey(new Date(student.registrationDate)) === key).length,
    };
  });

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);
  lastWeekEnd.setMilliseconds(-1);

  const thisWeek = allStudents.filter((student) => new Date(student.registrationDate) >= weekStart).length;
  const lastWeek = allStudents.filter((student) => {
    const registrationDate = new Date(student.registrationDate);
    return registrationDate >= lastWeekStart && registrationDate <= lastWeekEnd;
  }).length;

  return {
    totalStudents,
    registered,
    enrolled,
    seatsReserved,
    seatsAvailable,
    dailyRegistrations,
    weeklyComparison: { thisWeek, lastWeek },
    lowSeatAlerts: seats.filter((seat) => seat.lowSeatAlert),
  };
}

export async function getFilterOptions() {
  const [allStudents, seats] = await Promise.all([listStudents(), listSeatCapacities()]);
  return {
    schools: Array.from(new Set([...allStudents.map((student) => student.school), ...seats.map((seat) => seat.school)])).sort(),
    grades: Array.from(new Set([...allStudents.map((student) => student.grade), ...seats.map((seat) => seat.grade)])).sort(),
  };
}
