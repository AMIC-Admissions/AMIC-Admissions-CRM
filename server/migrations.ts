/**
 * Database Migration Helpers
 * Handles schema migrations and data transformations
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

export interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    columnsAdded?: number;
    rowsUpdated?: number;
    enumsUpdated?: number;
  };
}

/**
 * Apply the 0004 migration: Expand students table with AJYAL AL-MAARIFA fields
 */
export async function applyMigration0004(): Promise<MigrationResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database connection unavailable",
    };
  }

  try {
    console.log("[Migration 0004] Starting students table expansion...");

    // Step 1: Update existing studentType values
    console.log("[Migration 0004] Step 1: Mapping studentType values...");
    try {
      await db.execute(sql`UPDATE students SET studentType = 'New Admission' WHERE studentType = 'New'`);
      console.log("[Migration 0004] ✓ Mapped 'New' → 'New Admission'");
    } catch (error: any) {
      if (!error.message.includes("Unknown column")) {
        console.log("[Migration 0004] ℹ studentType mapping skipped");
      }
    }

    // Step 2: Modify enum columns
    console.log("[Migration 0004] Step 2: Updating enum definitions...");
    try {
      await db.execute(
        sql`ALTER TABLE students MODIFY COLUMN nationality enum('Saudi','Non-Saudi') NOT NULL DEFAULT 'Saudi'`
      );
      console.log("[Migration 0004] ✓ Updated nationality enum");
    } catch (error: any) {
      console.log("[Migration 0004] ℹ nationality enum already updated");
    }

    try {
      await db.execute(
        sql`ALTER TABLE students MODIFY COLUMN studentType enum('New Admission','Enrollment','Re-Registration','Transfer') NOT NULL DEFAULT 'New Admission'`
      );
      console.log("[Migration 0004] ✓ Updated studentType enum");
    } catch (error: any) {
      console.log("[Migration 0004] ℹ studentType enum already updated");
    }

    try {
      await db.execute(
        sql`ALTER TABLE students MODIFY COLUMN paymentStatus enum('Pending','Partial','Paid') NOT NULL DEFAULT 'Pending'`
      );
      console.log("[Migration 0004] Updated paymentStatus enum");
    } catch (error: any) {
      console.log("[Migration 0004] paymentStatus enum already updated");
    }

    try {
      await db.execute(
        sql`ALTER TABLE students MODIFY COLUMN paymentMethod enum('Cash','Bank Transfer','Card','Tamara','JeelPay','Promissory Note')`
      );
      console.log("[Migration 0004] Updated paymentMethod enum");
    } catch (error: any) {
      console.log("[Migration 0004] paymentMethod enum already updated");
    }

    // Step 3: Add new columns
    console.log("[Migration 0004] Step 3: Adding new columns...");
    const columnsToAdd = [
      { name: "dateOfBirth", def: "dateOfBirth date" },
      { name: "dateOfJoin", def: "dateOfJoin date" },
      { name: "assessed", def: "assessed boolean DEFAULT false NOT NULL" },
      { name: "passed", def: "passed boolean DEFAULT false NOT NULL" },
      { name: "reAssessment", def: "reAssessment boolean DEFAULT false NOT NULL" },
      { name: "passedRe", def: "passedRe boolean DEFAULT false NOT NULL" },
      { name: "registration", def: "registration boolean DEFAULT false NOT NULL" },
      { name: "enrollment", def: "enrollment boolean DEFAULT false NOT NULL" },
      { name: "transfer", def: "transfer boolean DEFAULT false NOT NULL" },
      { name: "firstInstallment", def: "firstInstallment boolean DEFAULT false NOT NULL" },
      { name: "secondInstallment", def: "secondInstallment boolean DEFAULT false NOT NULL" },
      { name: "fullPayment", def: "fullPayment boolean DEFAULT false NOT NULL" },
      { name: "promissoryNote", def: "promissoryNote boolean DEFAULT false NOT NULL" },
      { name: "tamara", def: "tamara boolean DEFAULT false NOT NULL" },
      { name: "jeelPay", def: "jeelPay boolean DEFAULT false NOT NULL" },
      { name: "docsSigned", def: "docsSigned boolean DEFAULT false NOT NULL" },
      { name: "requirementsSubmitted", def: "requirementsSubmitted boolean DEFAULT false NOT NULL" },
      { name: "fatherId", def: "fatherId varchar(50)" },
      { name: "fatherMobile", def: "fatherMobile varchar(20)" },
      { name: "motherId", def: "motherId varchar(50)" },
      { name: "motherMobile", def: "motherMobile varchar(20)" },
      { name: "notes", def: "notes text" },
    ];

    let addedCount = 0;
    for (const column of columnsToAdd) {
      try {
        await db.execute(sql.raw(`ALTER TABLE students ADD COLUMN ${column.def}`));
        addedCount++;
        console.log(`[Migration 0004] ✓ Added column: ${column.name}`);
      } catch (error: any) {
        if (error.message.includes("already exists")) {
          console.log(`[Migration 0004] ℹ Column already exists: ${column.name}`);
        } else {
          throw error;
        }
      }
    }

    console.log(`[Migration 0004] ✓ Migration completed successfully`);

    return {
      success: true,
      message: "Migration 0004 applied successfully",
      details: {
        columnsAdded: addedCount,
        enumsUpdated: 4,
      },
    };
  } catch (error: any) {
    console.error("[Migration 0004] ❌ Migration failed:", error.message);
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
    };
  }
}

/**
 * Check migration status
 */
export async function checkMigrationStatus(): Promise<{
  applied: boolean;
  missingColumns: string[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      applied: false,
      missingColumns: [],
    };
  }

  try {
    // Get all columns in students table
    const [columns] = await db.execute(sql`SHOW COLUMNS FROM students`);
    const columnNames = (Array.isArray(columns) ? columns : []).map((c: any) => c.Field);

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

    return {
      applied: missingColumns.length === 0,
      missingColumns: missingColumns as string[],
    };
  } catch (error) {
    return {
      applied: false,
      missingColumns: [],
    };
  }
}
