#!/usr/bin/env node

/**
 * Data migration script for students table schema upgrade
 * Handles enum value mapping and applies schema changes
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

try {
  console.log("Starting students table migration...");

  // Step 1: Update existing data to match new enum values
  console.log("Step 1: Mapping old studentType values to new ones...");
  await connection.execute(
    "UPDATE students SET studentType = 'New Admission' WHERE studentType = 'New'"
  );
  console.log("  ✓ Mapped 'New' → 'New Admission'");

  // Step 2: Add new columns
  console.log("Step 2: Adding new columns...");
  const addColumnsSQL = `
    ALTER TABLE students ADD COLUMN IF NOT EXISTS dateOfBirth date;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS dateOfJoin date;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS assessed boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS passed boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS reAssessment boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS passedRe boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS registration boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS transfer boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS firstInstallment boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS secondInstallment boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS fullPayment boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS promissoryNote boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS tamara boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS jeelPay boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS docsSigned boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS requirementsSubmitted boolean DEFAULT false NOT NULL;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS fatherId varchar(50);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS fatherMobile varchar(20);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS motherId varchar(50);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS motherMobile varchar(20);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS notes text;
  `;

  const statements = addColumnsSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await connection.execute(statement);
    } catch (error) {
      // Ignore "column already exists" errors
      if (!error.message.includes("already exists")) {
        throw error;
      }
    }
  }
  console.log("  ✓ Added all new columns");

  // Step 3: Update enum values
  console.log("Step 3: Updating enum definitions...");
  try {
    await connection.execute(
      "ALTER TABLE students MODIFY COLUMN nationality enum('Saudi','Non-Saudi') NOT NULL DEFAULT 'Saudi'"
    );
    console.log("  ✓ Updated nationality enum");
  } catch (error) {
    if (!error.message.includes("Duplicate")) {
      throw error;
    }
  }

  try {
    await connection.execute(
      "ALTER TABLE students MODIFY COLUMN studentType enum('New Admission','Enrollment','Re-Registration','Transfer') NOT NULL DEFAULT 'New Admission'"
    );
    console.log("  ✓ Updated studentType enum");
  } catch (error) {
    if (!error.message.includes("Duplicate")) {
      throw error;
    }
  }

  // Step 4: Verify migration
  console.log("Step 4: Verifying migration...");
  const [columns] = await connection.execute(
    "SHOW COLUMNS FROM students"
  );
  const columnNames = columns.map((c) => c.Field);
  const expectedColumns = [
    "dateOfBirth",
    "dateOfJoin",
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
    "fatherId",
    "fatherMobile",
    "motherId",
    "motherMobile",
    "notes",
  ];

  const missingColumns = expectedColumns.filter((col) => !columnNames.includes(col));
  if (missingColumns.length > 0) {
    console.log("  ⚠ Warning: Missing columns:", missingColumns);
  } else {
    console.log("  ✓ All expected columns present");
  }

  console.log("\n✅ Migration completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Migration failed:", error.message);
  process.exit(1);
} finally {
  await connection.end();
}
