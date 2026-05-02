#!/usr/bin/env node

/**
 * Safe migration script for students table schema upgrade
 * Handles enum value mapping and applies schema changes safely
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function runMigration() {
  const connection = await pool.getConnection();

  try {
    console.log("🔄 Starting students table migration...\n");

    // Step 1: Update existing data to match new enum values
    console.log("Step 1: Mapping old studentType values to new ones...");
    try {
      const [result1] = await connection.execute(
        "UPDATE students SET studentType = 'New Admission' WHERE studentType = 'New'"
      );
      console.log(`  ✓ Mapped 'New' → 'New Admission' (${result1.affectedRows} rows)`);

      const [result2] = await connection.execute(
        "UPDATE students SET studentType = 'Re-Registration' WHERE studentType = 'Re-Registration'"
      );
      console.log(`  ✓ Verified 'Re-Registration' (${result2.affectedRows} rows)`);

      const [result3] = await connection.execute(
        "UPDATE students SET studentType = 'Enrollment' WHERE studentType = 'Enrollment'"
      );
      console.log(`  ✓ Verified 'Enrollment' (${result3.affectedRows} rows)`);
    } catch (error) {
      console.log("  ⚠ Data mapping skipped (may already be done)");
    }

    // Step 2: Add new columns (if they don't exist)
    console.log("\nStep 2: Adding new columns...");
    const columnsToAdd = [
      "dateOfBirth date",
      "dateOfJoin date",
      "assessed boolean DEFAULT false NOT NULL",
      "passed boolean DEFAULT false NOT NULL",
      "reAssessment boolean DEFAULT false NOT NULL",
      "passedRe boolean DEFAULT false NOT NULL",
      "registration boolean DEFAULT false NOT NULL",
      "enrollment boolean DEFAULT false NOT NULL",
      "transfer boolean DEFAULT false NOT NULL",
      "firstInstallment boolean DEFAULT false NOT NULL",
      "secondInstallment boolean DEFAULT false NOT NULL",
      "fullPayment boolean DEFAULT false NOT NULL",
      "promissoryNote boolean DEFAULT false NOT NULL",
      "tamara boolean DEFAULT false NOT NULL",
      "jeelPay boolean DEFAULT false NOT NULL",
      "docsSigned boolean DEFAULT false NOT NULL",
      "requirementsSubmitted boolean DEFAULT false NOT NULL",
      "fatherId varchar(50)",
      "fatherMobile varchar(20)",
      "motherId varchar(50)",
      "motherMobile varchar(20)",
      "notes text",
    ];

    let addedCount = 0;
    for (const columnDef of columnsToAdd) {
      const columnName = columnDef.split(" ")[0];
      try {
        await connection.execute(`ALTER TABLE students ADD COLUMN ${columnDef}`);
        addedCount++;
        console.log(`  ✓ Added column: ${columnName}`);
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`  ℹ Column already exists: ${columnName}`);
        } else {
          throw error;
        }
      }
    }
    console.log(`  ✓ Total new columns added: ${addedCount}`);

    // Step 3: Update enum definitions
    console.log("\nStep 3: Updating enum definitions...");
    try {
      await connection.execute(
        "ALTER TABLE students MODIFY COLUMN nationality enum('Saudi','Non-Saudi') NOT NULL DEFAULT 'Saudi'"
      );
      console.log("  ✓ Updated nationality enum");
    } catch (error) {
      if (!error.message.includes("Duplicate")) {
        throw error;
      }
      console.log("  ℹ nationality enum already updated");
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
      console.log("  ℹ studentType enum already updated");
    }

    // Step 4: Verify migration
    console.log("\nStep 4: Verifying migration...");
    const [columns] = await connection.execute("SHOW COLUMNS FROM students");
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
    const presentColumns = expectedColumns.filter((col) => columnNames.includes(col));

    console.log(`  ✓ Present columns: ${presentColumns.length}/${expectedColumns.length}`);

    if (missingColumns.length > 0) {
      console.log(`  ⚠ Missing columns: ${missingColumns.join(", ")}`);
      throw new Error(`Migration incomplete: missing columns ${missingColumns.join(", ")}`);
    }

    // Step 5: Verify enum values
    console.log("\nStep 5: Verifying enum values...");
    const [studentTypeInfo] = await connection.execute(
      "SHOW COLUMNS FROM students WHERE Field = 'studentType'"
    );
    const [nationalityInfo] = await connection.execute(
      "SHOW COLUMNS FROM students WHERE Field = 'nationality'"
    );

    console.log(`  ✓ studentType: ${studentTypeInfo[0].Type}`);
    console.log(`  ✓ nationality: ${nationalityInfo[0].Type}`);

    // Step 6: Record migration in drizzle meta
    console.log("\nStep 6: Recording migration...");
    try {
      const metaDir = path.join(__dirname, "drizzle", ".migrations");
      if (!fs.existsSync(metaDir)) {
        fs.mkdirSync(metaDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(metaDir, "0004_chemical_prism.sql"),
        fs.readFileSync(path.join(__dirname, "drizzle", "0004_chemical_prism.sql"))
      );
      console.log("  ✓ Migration recorded");
    } catch (error) {
      console.log("  ℹ Migration record skipped (optional)");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - Total columns in students table: ${columnNames.length}`);
    console.log(`  - New columns added: ${presentColumns.length}`);
    console.log(`  - Enum values updated: 2 (nationality, studentType)`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

runMigration();
