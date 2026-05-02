import { getDb } from "./server/db.ts";
import { students, seats } from "./drizzle/schema.ts";
import { eq, sql } from "drizzle-orm";

async function fixDataConsistency() {
  console.log("🔧 Starting data consistency fix...\n");

  const db = await getDb();

  try {
    // Step 1: Fix File Complete
    console.log("📋 Step 1: Fixing File Complete...");
    await db
      .update(students)
      .set({
        fileComplete: sql`docs_signed AND req_submitted`,
      })
      .execute();
    console.log("✓ File Complete fixed\n");

    // Step 2: Fix Seat Reserved
    console.log("🪑 Step 2: Fixing Seat Reserved...");
    await db
      .update(students)
      .set({
        seatReserved: sql`
          CASE 
            WHEN student_type IN ('Enrollment', 'Re-Registration') THEN TRUE
            WHEN first_installment = TRUE OR second_installment = TRUE OR full_payment = TRUE OR promissory_note = TRUE OR tamara = TRUE OR jeelPay = TRUE THEN TRUE
            ELSE FALSE
          END
        `,
      })
      .execute();
    console.log("✓ Seat Reserved fixed\n");

    // Step 3: Fix Payment Status
    console.log("💳 Step 3: Fixing Payment Status...");
    await db
      .update(students)
      .set({
        paymentStatus: sql`
          CASE 
            WHEN full_payment = TRUE OR tamara = TRUE OR jeelPay = TRUE THEN 'Paid'
            WHEN first_installment = TRUE OR second_installment = TRUE OR promissory_note = TRUE THEN 'Partial'
            ELSE 'Pending'
          END
        `,
      })
      .execute();
    console.log("✓ Payment Status fixed\n");

    // Step 4: Backfill NULL values with FALSE
    console.log("📝 Step 4: Backfilling NULL values...");
    const booleanFields = [
      "assessed",
      "passed",
      "reAssessment",
      "passedRe",
      "registration",
      "enrollment",
      "transfer",
      "firstInstallment",
      "secondInstallment",
      "fullPayment",
      "promissoryNote",
      "tamara",
      "jeelPay",
      "docsSigned",
      "requirementsSubmitted",
      "fileComplete",
      "seatReserved",
    ];

    for (const field of booleanFields) {
      await db
        .update(students)
        .set({ [field]: false })
        .where(sql`${students[field]} IS NULL`)
        .execute();
    }
    console.log("✓ NULL values backfilled\n");

    // Step 5: Rebuild seats table
    console.log("🏫 Step 5: Rebuilding seats table...");

    // Clear existing seats
    await db.delete(seats).execute();

    // Get all unique school/grade combinations
    const schoolGradeCombos = await db
      .selectDistinct({
        school: students.school,
        grade: students.grade,
      })
      .from(students)
      .execute();

    console.log(`Found ${schoolGradeCombos.length} school/grade combinations\n`);

    // For each combination, calculate capacity and reserved seats
    for (const combo of schoolGradeCombos) {
      // Get students for this school/grade
      const studentList = await db
        .select()
        .from(students)
        .where(
          sql`school = ${combo.school} AND grade = ${combo.grade}`
        )
        .execute();

      // Count reserved seats
      const reservedCount = studentList.filter(
        (s) => s.seatReserved === true
      ).length;

      // Determine capacity based on school and grade
      let capacity = 0;
      if (combo.school === "AMIS Girls" || combo.school === "AMIS Boys") {
        capacity = 30; // Default capacity per grade
      } else if (combo.school === "Kids Gate") {
        capacity = 25; // Smaller capacity for Kids Gate
      }

      // Insert into seats table
      await db
        .insert(seats)
        .values({
          school: combo.school,
          grade: combo.grade,
          section: "A", // Default section
          capacity,
          reservedSeats: reservedCount,
        })
        .execute();

      console.log(
        `✓ ${combo.school} - ${combo.grade}: Capacity=${capacity}, Reserved=${reservedCount}`
      );
    }
    console.log("\n✓ Seats table rebuilt\n");

    // Step 6: Verify data
    console.log("✅ Step 6: Verifying data consistency...");

    const totalStudents = await db
      .select({ count: sql`COUNT(*)` })
      .from(students)
      .execute();

    const seatsReserved = await db
      .select({ count: sql`COUNT(*)` })
      .from(students)
      .where(sql`seat_reserved = TRUE`)
      .execute();

    const paidStudents = await db
      .select({ count: sql`COUNT(*)` })
      .from(students)
      .where(sql`payment_status = 'Paid'`)
      .execute();

    const fileCompleteStudents = await db
      .select({ count: sql`COUNT(*)` })
      .from(students)
      .where(sql`file_complete = TRUE`)
      .execute();

    console.log("\n📊 Data Summary:");
    console.log(`Total Students: ${totalStudents[0].count}`);
    console.log(`Seats Reserved: ${seatsReserved[0].count}`);
    console.log(`Paid Students: ${paidStudents[0].count}`);
    console.log(`File Complete: ${fileCompleteStudents[0].count}`);

    console.log("\n✅ Data consistency fix completed successfully!");
  } catch (error) {
    console.error("❌ Error during data fix:", error);
    process.exit(1);
  }
}

fixDataConsistency();
