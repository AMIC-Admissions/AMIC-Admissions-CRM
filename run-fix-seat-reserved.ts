#!/usr/bin/env node

import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

console.log("🔧 Fixing seatReserved for all students...\n");

try {
  const db = (await getDb()) as any;
  
  // Step 1: Reset all seatReserved to FALSE
  console.log("Step 1: Resetting all seatReserved to FALSE...");
  await db.execute(sql`UPDATE students SET seatReserved = FALSE`);
  console.log("✓ Reset complete\n");
  
  // Step 2: Set seatReserved = TRUE for students matching criteria
  console.log("Step 2: Setting seatReserved = TRUE for students with:");
  console.log("  - studentType = 'Re-Registration'");
  console.log("  - OR any payment field = TRUE");
  
  await db.execute(sql`
    UPDATE students
    SET seatReserved = TRUE
    WHERE
      studentType = 'Re-Registration'
      OR firstInstallment = TRUE
      OR secondInstallment = TRUE
      OR fullPayment = TRUE
      OR promissoryNote = TRUE
      OR tamara = TRUE
      OR jeelPay = TRUE
  `);
  console.log("✓ Update complete\n");
  
  // Verify results
  const result = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN seatReserved = TRUE THEN 1 ELSE 0 END) as reserved,
      SUM(CASE WHEN seatReserved = FALSE THEN 1 ELSE 0 END) as not_reserved
    FROM students
  `);
  
  console.log("📊 Verification:");
  console.log(`  Total students: ${result[0]?.total || 0}`);
  console.log(`  Students with seatReserved=TRUE: ${result[0]?.reserved || 0}`);
  console.log(`  Students with seatReserved=FALSE: ${result[0]?.not_reserved || 0}`);
  
  console.log("\n✅ seatReserved fix completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
