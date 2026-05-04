#!/usr/bin/env node

import { getDb } from "./server/db";
import { students as studentsTable, seatMaster } from "./drizzle/schema";
import { eq } from "drizzle-orm";

console.log("🔍 Checking section matching...\n");

try {
  const db = (await getDb()) as any;
  
  // Get reserved students
  const reserved = await db.select().from(studentsTable).where(eq(studentsTable.seatReserved, true));
  
  console.log(`Found ${reserved.length} students with seatReserved=true\n`);
  
  // Show their school/grade/section
  console.log("Reserved students:");
  reserved.slice(0, 5).forEach((s: any) => {
    console.log(`  ${s.name}: ${s.school} / ${s.grade} / ${s.section}`);
  });
  
  // Get seat_master records
  const seats = await db.select().from(seatMaster);
  
  console.log(`\n\nFound ${seats.length} seat_master records\n`);
  
  // Show sample seat_master records
  console.log("Sample seat_master records:");
  seats.slice(0, 5).forEach((s: any) => {
    console.log(`  ${s.school} / ${s.grade} / ${s.section} (capacity: ${s.capacity})`);
  });
  
  // Check if any reserved students match seat_master
  let matches = 0;
  reserved.forEach((student: any) => {
    const match = seats.find((seat: any) => 
      seat.school === student.school && 
      seat.grade === student.grade && 
      seat.section === student.section
    );
    if (match) matches++;
  });
  
  console.log(`\n\n✅ Students with matching seat_master: ${matches}/${reserved.length}`);
  
  // Check if students have NULL sections
  const nullSections = reserved.filter((s: any) => s.section === null).length;
  console.log(`\n⚠️  Students with NULL section: ${nullSections}/${reserved.length}`);
  
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
