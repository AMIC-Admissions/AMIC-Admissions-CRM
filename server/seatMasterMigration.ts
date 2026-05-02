import { getDb } from "./db";
import { seatMaster } from "../drizzle/schema";
import { sql } from "drizzle-orm";

const SEAT_MASTER_DATA = [
  // Kids Gate
  { school: "Kids Gate", grade: "Pre-KG", section: "Mixed", gender: "Mixed", capacity: 30 },
  { school: "Kids Gate", grade: "KG I", section: "Mixed", gender: "Mixed", capacity: 60 },
  { school: "Kids Gate", grade: "KG II", section: "Mixed", gender: "Mixed", capacity: 50 },
  { school: "Kids Gate", grade: "Grade 1", section: "A", gender: "Female", capacity: 25 },
  { school: "Kids Gate", grade: "Grade 1", section: "B", gender: "Male", capacity: 25 },
  { school: "Kids Gate", grade: "Grade 2", section: "A", gender: "Female", capacity: 25 },
  { school: "Kids Gate", grade: "Grade 2", section: "B", gender: "Male", capacity: 25 },
  { school: "Kids Gate", grade: "Grade 3", section: "A", gender: "Female", capacity: 25 },
  { school: "Kids Gate", grade: "Grade 3", section: "B", gender: "Male", capacity: 25 },

  // AMIS Girls
  { school: "AMIS Girls", grade: "Pre-KG", section: "Mixed", gender: "Mixed", capacity: 20 },
  { school: "AMIS Girls", grade: "KG I", section: "Mixed", gender: "Mixed", capacity: 75 },
  { school: "AMIS Girls", grade: "KG II", section: "Mixed", gender: "Mixed", capacity: 108 },
  { school: "AMIS Girls", grade: "Grade 1", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 1", section: "B", gender: "Female", capacity: 25 },
  { school: "AMIS Girls", grade: "Grade 1", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 1", section: "D", gender: "Female", capacity: 25 },
  { school: "AMIS Girls", grade: "Grade 1", section: "F", gender: "Female", capacity: 25 },
  { school: "AMIS Girls", grade: "Grade 2", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 2", section: "B", gender: "Female", capacity: 25 },
  { school: "AMIS Girls", grade: "Grade 2", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 2", section: "D", gender: "Female", capacity: 25 },
  { school: "AMIS Girls", grade: "Grade 2", section: "F", gender: "Female", capacity: 25 },
  { school: "AMIS Girls", grade: "Grade 3", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 3", section: "B", gender: "Female", capacity: 25 },
  { school: "AMIS Girls", grade: "Grade 3", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 3", section: "D", gender: "Female", capacity: 25 },
  { school: "AMIS Girls", grade: "Grade 4", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 4", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 4", section: "E", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 5", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 5", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 5", section: "E", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 6", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 6", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 7", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 7", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 8", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 8", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 9", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 9", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 10", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 10", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 11", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 11", section: "C", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 12", section: "A", gender: "Female", capacity: 30 },
  { school: "AMIS Girls", grade: "Grade 12", section: "C", gender: "Female", capacity: 30 },

  // AMIS Boys
  { school: "AMIS Boys", grade: "Grade 4", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 4", section: "D", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 5", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 5", section: "D", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 6", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 6", section: "D", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 7", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 7", section: "D", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 8", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 8", section: "D", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 9", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 9", section: "D", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 10", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 10", section: "D", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 11", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 11", section: "D", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 12", section: "B", gender: "Male", capacity: 30 },
  { school: "AMIS Boys", grade: "Grade 12", section: "D", gender: "Male", capacity: 30 },
];

export async function applySeatMasterMigration() {
  try {
    const db = (await getDb()) as any;
    
    if (!db) {
      return { success: false, message: "Database connection unavailable" };
    }
    
    // Try to truncate existing data
    try {
      await db.execute(sql`TRUNCATE TABLE seat_master`);
      console.log("Truncated existing seat_master data");
    } catch (e: any) {
      console.log("seat_master table not found or cannot truncate, proceeding with insert");
    }
    
    // Insert all records
    let insertedCount = 0;
    for (const record of SEAT_MASTER_DATA) {
      try {
        await db.insert(seatMaster).values(record);
        insertedCount++;
      } catch (e: any) {
        console.error(`Error inserting record: ${JSON.stringify(record)}`, e);
        // Continue with next record
      }
    }
    
    // Verify insertion
    let verifyCount = 0;
    try {
      const result = await db.select().from(seatMaster);
      verifyCount = result ? result.length : 0;
    } catch (e) {
      console.error("Error verifying seat_master data:", e);
    }
    
    return {
      success: verifyCount > 0,
      message: verifyCount > 0 
        ? `Seat Master migration completed. Inserted ${verifyCount} records.`
        : `Failed to insert records. Attempted: ${insertedCount}, Verified: ${verifyCount}`,
      recordCount: verifyCount,
      expectedCount: SEAT_MASTER_DATA.length,
    };
  } catch (error) {
    console.error("Error applying Seat Master migration:", error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getSeatMasterStatus() {
  try {
    const db = (await getDb()) as any;
    
    if (!db) {
      return {
        status: "unavailable",
        message: "Database connection unavailable",
        recordCount: 0,
      };
    }
    
    const allSeats = await db.select().from(seatMaster);
    
    if (!allSeats || allSeats.length === 0) {
      return {
        status: "empty",
        message: "Seat Master table exists but is empty",
        recordCount: 0,
      };
    }
    
    const bySchool: any = {};
    let totalCapacity = 0;
    
    for (const seat of allSeats) {
      if (!bySchool[seat.school]) {
        bySchool[seat.school] = { count: 0, capacity: 0 };
      }
      bySchool[seat.school].count++;
      bySchool[seat.school].capacity += seat.capacity;
      totalCapacity += seat.capacity;
    }
    
    return {
      status: "populated",
      message: "Seat Master is populated and ready",
      recordCount: allSeats.length,
      totalCapacity,
      bySchool,
    };
  } catch (error) {
    console.error("Error getting Seat Master status:", error);
    return {
      status: "error",
      message: `Error checking status: ${error instanceof Error ? error.message : String(error)}`,
      recordCount: 0,
    };
  }
}
