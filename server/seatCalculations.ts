import { getDb } from "./db";
import { students, seatMaster } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { SEAT_MASTER_DATA } from "./seatMasterData";

/**
 * Get seat availability for all seats in seat_master
 * Calculates reserved and available seats based on actual student count
 * With resilient fallback logic for database unavailability
 * Handles students with NULL sections by assigning to first section per school/grade
 */
export async function getSeatAvailability() {
  try {
    const db = (await getDb()) as any;
    if (!db) {
      console.log("[SeatCalc] Database unavailable, using fallback hardcoded seat master data");
      const fallbackSeats = SEAT_MASTER_DATA.map((seat: any) => ({
        ...seat,
        reserved: 0,
        available: seat.capacity,
        occupancyPercent: 0,
      }));
      return {
        success: true,
        seats: fallbackSeats,
        totalCapacity: SEAT_MASTER_DATA.reduce((sum: number, s: any) => sum + s.capacity, 0),
        totalReserved: 0,
        totalAvailable: SEAT_MASTER_DATA.reduce((sum: number, s: any) => sum + s.capacity, 0),
      };
    }

    // Get all seats from seat_master
    let allSeats: any[] = [];
    try {
      allSeats = await db.select().from(seatMaster);
      console.log("[SeatCalc] Using database seat master data");
    } catch (err) {
      console.log("[SeatCalc] Database query failed, using fallback hardcoded seat master data");
      allSeats = SEAT_MASTER_DATA;
    }

    // If no seats found, use fallback
    if (allSeats.length === 0) {
      console.log("[SeatCalc] No seats in database, using fallback hardcoded seat master data");
      allSeats = SEAT_MASTER_DATA;
    }

    // Get all reserved student counts grouped by school/grade/section
    let reservedCounts: any[] = [];
    try {
      reservedCounts = await db
        .select({
          school: students.school,
          grade: students.grade,
          section: students.section,
          count: sql`COUNT(*)`
        })
        .from(students)
        .where(eq(students.seatReserved, true))
        .groupBy(students.school, students.grade, students.section);
      console.log(`[SeatCalc] Retrieved reserved counts for ${reservedCounts.length} seat groups`);
    } catch (err) {
      console.warn("[SeatCalc] Failed to get reserved counts, using 0 for all seats");
      reservedCounts = [];
    }

    // Build maps for quick lookup
    const reservedMap = new Map(); // "school|grade|section" => count
    const nullSectionCounts = new Map(); // "school|grade" => count of students with NULL section
    
    for (const row of reservedCounts) {
      if (row.section === null) {
        // Track students with NULL sections
        const sgKey = `${row.school}|${row.grade}`;
        nullSectionCounts.set(sgKey, row.count || 0);
      } else {
        // Track students with specific sections
        const key = `${row.school}|${row.grade}|${row.section}`;
        reservedMap.set(key, row.count || 0);
      }
    }

    // Build a map of seats by school/grade to find first section
    const seatsBySchoolGrade = new Map();
    for (const seat of allSeats) {
      const sgKey = `${seat.school}|${seat.grade}`;
      if (!seatsBySchoolGrade.has(sgKey)) {
        seatsBySchoolGrade.set(sgKey, []);
      }
      seatsBySchoolGrade.get(sgKey).push(seat);
    }

    // For each seat, calculate reserved and available
    const seatsWithAvailability = [];
    let totalReserved = 0;

    for (const seat of allSeats) {
      const key = `${seat.school}|${seat.grade}|${seat.section}`;
      let reserved = reservedMap.get(key) || 0;
      
      // If no exact match and there are students with NULL sections,
      // assign them to the first section for this school/grade
      if (reserved === 0) {
        const sgKey = `${seat.school}|${seat.grade}`;
        const nullCount = nullSectionCounts.get(sgKey) || 0;
        if (nullCount > 0) {
          const seatsForGrade = seatsBySchoolGrade.get(sgKey) || [];
          const isFirstSection = seatsForGrade[0]?.id === seat.id;
          if (isFirstSection) {
            reserved = nullCount;
            console.log(`[SeatCalc] Assigned ${nullCount} NULL-section students to ${seat.school}/${seat.grade}/${seat.section}`);
          }
        }
      }
      
      const available = seat.capacity - reserved;
      totalReserved += reserved;

      seatsWithAvailability.push({
        ...seat,
        reserved,
        available,
        occupancyPercent: Math.round((reserved / seat.capacity) * 100),
      });
    }

    const totalCapacity = allSeats.reduce((sum: number, s: any) => sum + s.capacity, 0);
    const totalAvailable = totalCapacity - totalReserved;

    return {
      success: true,
      seats: seatsWithAvailability,
      totalCapacity,
      totalReserved,
      totalAvailable,
    };
  } catch (error) {
    console.error("[SeatCalc] Critical error:", error);
    // Return fallback data on critical error
    const fallbackSeats = SEAT_MASTER_DATA.map((seat: any) => ({
      ...seat,
      reserved: 0,
      available: seat.capacity,
      occupancyPercent: 0,
    }));
    return {
      success: true,
      seats: fallbackSeats,
      totalCapacity: SEAT_MASTER_DATA.reduce((sum: number, s: any) => sum + s.capacity, 0),
      totalReserved: 0,
      totalAvailable: SEAT_MASTER_DATA.reduce((sum: number, s: any) => sum + s.capacity, 0),
    };
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
