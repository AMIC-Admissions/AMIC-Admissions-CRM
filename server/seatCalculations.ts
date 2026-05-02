import { getDb } from "./db";
import { students, seatMaster } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { SEAT_MASTER_DATA } from "./seatMasterData";

/**
 * Get seat availability for all seats in seat_master
 * Calculates reserved and available seats based on actual student count
 */
export async function getSeatAvailability() {
  try {
    const db = (await getDb()) as any;

    // Get all seats from seat_master
    let allSeats = await db.select().from(seatMaster).catch(() => []);

    // Fallback to hardcoded data if database is empty
    if (allSeats.length === 0) {
      console.log("[SeatCalc] Using fallback hardcoded seat master data");
      allSeats = SEAT_MASTER_DATA;
    } else {
      console.log("[SeatCalc] Using database seat master data");
    }

    // For each seat, count reserved students
    const seatsWithAvailability = [];

    for (const seat of allSeats) {
      // Count students with seatReserved = TRUE matching this seat
      const reservedCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(students)
        .where(
          and(
            eq(students.school, seat.school),
            eq(students.grade, seat.grade),
            eq(students.section, seat.section),
            eq(students.seatReserved, true)
          )
        );

      const reserved = reservedCount[0]?.count || 0;
      const available = seat.capacity - reserved;

      seatsWithAvailability.push({
        ...seat,
        reserved,
        available,
        occupancyPercent: Math.round((reserved / seat.capacity) * 100),
      });
    }

    return {
      success: true,
      seats: seatsWithAvailability,
      totalCapacity: allSeats.reduce((sum: number, s: any) => sum + s.capacity, 0),
      totalReserved: seatsWithAvailability.reduce((sum: number, s: any) => sum + s.reserved, 0),
      totalAvailable: seatsWithAvailability.reduce((sum: number, s: any) => sum + s.available, 0),
    };
  } catch (error) {
    console.error("Error getting seat availability:", error);
    throw error;
  }
}

/**
 * Get seat availability by school
 */
export async function getSeatAvailabilityBySchool(school: string) {
  try {
    const db = (await getDb()) as any;

    let schoolSeats = await db
      .select()
      .from(seatMaster)
      .where(eq(seatMaster.school, school))
      .catch(() => []);

    // Fallback to hardcoded data
    if (schoolSeats.length === 0) {
      schoolSeats = SEAT_MASTER_DATA.filter((s: any) => s.school === school);
      if (schoolSeats.length === 0) {
        return {
          success: false,
          message: `No seats found for school: ${school}`,
          seats: [],
        };
      }
    }

    const seatsWithAvailability = [];

    for (const seat of schoolSeats) {
      const reservedCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(students)
        .where(
          and(
            eq(students.school, seat.school),
            eq(students.grade, seat.grade),
            eq(students.section, seat.section),
            eq(students.seatReserved, true)
          )
        );

      const reserved = reservedCount[0]?.count || 0;
      const available = seat.capacity - reserved;

      seatsWithAvailability.push({
        ...seat,
        reserved,
        available,
        occupancyPercent: Math.round((reserved / seat.capacity) * 100),
      });
    }

    return {
      success: true,
      school,
      seats: seatsWithAvailability,
      totalCapacity: schoolSeats.reduce((sum: number, s: any) => sum + s.capacity, 0),
      totalReserved: seatsWithAvailability.reduce((sum: number, s: any) => sum + s.reserved, 0),
      totalAvailable: seatsWithAvailability.reduce((sum: number, s: any) => sum + s.available, 0),
    };
  } catch (error) {
    console.error("Error getting school seat availability:", error);
    throw error;
  }
}

/**
 * Get seat availability by grade
 */
export async function getSeatAvailabilityByGrade(grade: string) {
  try {
    const db = (await getDb()) as any;

    let gradeSeats = await db
      .select()
      .from(seatMaster)
      .where(eq(seatMaster.grade, grade))
      .catch(() => []);

    // Fallback to hardcoded data
    if (gradeSeats.length === 0) {
      gradeSeats = SEAT_MASTER_DATA.filter((s: any) => s.grade === grade);
      if (gradeSeats.length === 0) {
        return {
          success: false,
          message: `No seats found for grade: ${grade}`,
          seats: [],
        };
      }
    }

    const seatsWithAvailability = [];

    for (const seat of gradeSeats) {
      const reservedCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(students)
        .where(
          and(
            eq(students.school, seat.school),
            eq(students.grade, seat.grade),
            eq(students.section, seat.section),
            eq(students.seatReserved, true)
          )
        );

      const reserved = reservedCount[0]?.count || 0;
      const available = seat.capacity - reserved;

      seatsWithAvailability.push({
        ...seat,
        reserved,
        available,
        occupancyPercent: Math.round((reserved / seat.capacity) * 100),
      });
    }

    return {
      success: true,
      grade,
      seats: seatsWithAvailability,
      totalCapacity: gradeSeats.reduce((sum: number, s: any) => sum + s.capacity, 0),
      totalReserved: seatsWithAvailability.reduce((sum: number, s: any) => sum + s.reserved, 0),
      totalAvailable: seatsWithAvailability.reduce((sum: number, s: any) => sum + s.available, 0),
    };
  } catch (error) {
    console.error("Error getting grade seat availability:", error);
    throw error;
  }
}

/**
 * Get low availability seats (< 5 available)
 */
export async function getLowAvailabilitySeats() {
  try {
    const availability = await getSeatAvailability();

    if (!availability.success) {
      return availability;
    }

    const lowSeats = availability.seats.filter((s: any) => s.available < 5);

    return {
      success: true,
      lowSeats,
      count: lowSeats.length,
    };
  } catch (error) {
    console.error("Error getting low availability seats:", error);
    throw error;
  }
}
