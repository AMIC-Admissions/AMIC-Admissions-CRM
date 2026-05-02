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
    
    // Check if table exists
    const tableExists = await db.execute(
      sql`SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seat_master'`
    );
    
    if (!tableExists || tableExists.length === 0) {
      return { success: false, message: "seat_master table does not exist. Run migration first." };
    }
    
    // Clear existing data
    await db.delete(seatMaster).execute();
    
    // Insert all records
    for (const record of SEAT_MASTER_DATA) {
      await db.insert(seatMaster).values(record);
    }
    
    // Verify insertion
    const count = await db.select().from(seatMaster);
    
    return {
      success: true,
      message: `Seat Master migration completed. Inserted ${count.length} records.`,
      recordCount: count.length,
      expectedCount: SEAT_MASTER_DATA.length,
    };
  } catch (error) {
    console.error("Error applying Seat Master migration:", error);
    throw error;
  }
}

export async function getSeatMasterStatus() {
  try {
    const db = (await getDb()) as any;
    
    const allSeats = await db.select().from(seatMaster);
    
    if (allSeats.length === 0) {
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
    throw error;
  }
}
