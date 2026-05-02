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

export async function initializeSeatMaster() {
  try {
    const db = (await getDb()) as any;
    if (!db) {
      console.log("[SeatMaster] Database not available");
      return;
    }

    // Create table if it doesn't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS seat_master (
          id INT AUTO_INCREMENT PRIMARY KEY,
          school VARCHAR(100) NOT NULL,
          grade VARCHAR(50) NOT NULL,
          section VARCHAR(10) NOT NULL,
          gender VARCHAR(20) NOT NULL,
          capacity INT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("[SeatMaster] Table created or already exists");
    } catch (e) {
      console.log("[SeatMaster] Table creation attempt completed");
    }

    // Check if table is empty
    try {
      const result = await db.execute(sql`SELECT COUNT(*) as count FROM seat_master`);
      const count = result?.[0]?.count || 0;

      if (count === 0) {
        console.log("[SeatMaster] Table is empty, seeding data...");
        
        // Use Drizzle insert with batch
        try {
          await db.insert(seatMaster).values(SEAT_MASTER_DATA);
          console.log("[SeatMaster] Batch insert completed");
        } catch (batchError: any) {
          console.error("[SeatMaster] Batch insert failed:", batchError.message);
          
          // Fall back to individual inserts
          console.log("[SeatMaster] Attempting individual inserts...");
          let successCount = 0;
          for (const record of SEAT_MASTER_DATA) {
            try {
              await db.insert(seatMaster).values(record);
              successCount++;
            } catch (e: any) {
              console.error(`[SeatMaster] Error inserting record:`, e.message);
            }
          }
          console.log(`[SeatMaster] Individual insert completed: ${successCount}/${SEAT_MASTER_DATA.length}`);
        }

        // Verify
        const verifyResult = await db.execute(sql`SELECT COUNT(*) as count FROM seat_master`);
        const verifyCount = verifyResult?.[0]?.count || 0;
        console.log(`[SeatMaster] Seeding complete. Total records: ${verifyCount}`);
      } else {
        console.log(`[SeatMaster] Table already populated with ${count} records`);
      }
    } catch (e) {
      console.error("[SeatMaster] Error during initialization:", e);
    }
  } catch (e) {
    console.error("[SeatMaster] Initialization failed:", e);
  }
}
