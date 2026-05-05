import { getDb } from "./server/db";
import fs from "fs";

async function executeMigration() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    // Read the SQL migration file
    const sql = fs.readFileSync("./drizzle/0006_tranquil_smasher.sql", "utf-8");
    
    // Split by statement breakpoint and execute each statement
    const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(s => s);
    
    for (const statement of statements) {
      console.log("Executing:", statement.substring(0, 50) + "...");
      await db.execute(statement as any);
    }
    
    console.log("✅ Migration executed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

executeMigration();
