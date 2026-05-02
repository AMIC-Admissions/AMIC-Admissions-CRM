// Hardcoded Seat Master Data - Used as fallback when database is unavailable
export const SEAT_MASTER_DATA = [
  // Kids Gate (9 records)
  { school: 'Kids Gate', grade: 'Pre-KG', section: 'Mixed', gender: 'Mixed', capacity: 30 },
  { school: 'Kids Gate', grade: 'KG I', section: 'Mixed', gender: 'Mixed', capacity: 60 },
  { school: 'Kids Gate', grade: 'KG II', section: 'Mixed', gender: 'Mixed', capacity: 50 },
  { school: 'Kids Gate', grade: 'Grade 1', section: 'A', gender: 'Female', capacity: 25 },
  { school: 'Kids Gate', grade: 'Grade 1', section: 'B', gender: 'Male', capacity: 25 },
  { school: 'Kids Gate', grade: 'Grade 2', section: 'A', gender: 'Female', capacity: 25 },
  { school: 'Kids Gate', grade: 'Grade 2', section: 'B', gender: 'Male', capacity: 25 },
  { school: 'Kids Gate', grade: 'Grade 3', section: 'A', gender: 'Female', capacity: 25 },
  { school: 'Kids Gate', grade: 'Grade 3', section: 'B', gender: 'Male', capacity: 25 },
  // AMIS Girls (35 records)
  { school: 'AMIS Girls', grade: 'Pre-KG', section: 'Mixed', gender: 'Mixed', capacity: 20 },
  { school: 'AMIS Girls', grade: 'KG I', section: 'Mixed', gender: 'Mixed', capacity: 75 },
  { school: 'AMIS Girls', grade: 'KG II', section: 'Mixed', gender: 'Mixed', capacity: 108 },
  { school: 'AMIS Girls', grade: 'Grade 1', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 1', section: 'B', gender: 'Female', capacity: 25 },
  { school: 'AMIS Girls', grade: 'Grade 1', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 1', section: 'D', gender: 'Female', capacity: 25 },
  { school: 'AMIS Girls', grade: 'Grade 1', section: 'F', gender: 'Female', capacity: 25 },
  { school: 'AMIS Girls', grade: 'Grade 2', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 2', section: 'B', gender: 'Female', capacity: 25 },
  { school: 'AMIS Girls', grade: 'Grade 2', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 2', section: 'D', gender: 'Female', capacity: 25 },
  { school: 'AMIS Girls', grade: 'Grade 2', section: 'F', gender: 'Female', capacity: 25 },
  { school: 'AMIS Girls', grade: 'Grade 3', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 3', section: 'B', gender: 'Female', capacity: 25 },
  { school: 'AMIS Girls', grade: 'Grade 3', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 3', section: 'D', gender: 'Female', capacity: 25 },
  { school: 'AMIS Girls', grade: 'Grade 4', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 4', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 4', section: 'E', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 5', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 5', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 5', section: 'E', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 6', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 6', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 7', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 7', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 8', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 8', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 9', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 9', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 10', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 10', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 11', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 11', section: 'C', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 12', section: 'A', gender: 'Female', capacity: 30 },
  { school: 'AMIS Girls', grade: 'Grade 12', section: 'C', gender: 'Female', capacity: 30 },
  // AMIS Boys (13 records)
  { school: 'AMIS Boys', grade: 'Grade 4', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 4', section: 'D', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 5', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 5', section: 'D', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 6', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 6', section: 'D', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 7', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 7', section: 'D', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 8', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 8', section: 'D', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 9', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 9', section: 'D', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 10', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 10', section: 'D', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 11', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 11', section: 'D', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 12', section: 'B', gender: 'Male', capacity: 30 },
  { school: 'AMIS Boys', grade: 'Grade 12', section: 'D', gender: 'Male', capacity: 30 },
];

export async function getSeatMasterData(db: any) {
  try {
    // Try to get from database first
    const dbSeats = await db.query.seatMaster.findMany();
    if (dbSeats && dbSeats.length > 0) {
      console.log("[SeatMaster] Using database records:", dbSeats.length);
      return dbSeats;
    }
  } catch (e) {
    // Silently fall through
  }

  // Fallback to hardcoded data
  console.log("[SeatMaster] Using fallback hardcoded data (57 records)");
  return SEAT_MASTER_DATA;
}
