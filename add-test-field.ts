import { getDb } from "./server/db";
import { fieldsConfig } from "./drizzle/schema";

async function addTestField() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Database not available");
      return;
    }
    const result = await db.insert(fieldsConfig).values({
      fieldKey: "transportation",
      fieldLabel: "Transportation",
      fieldType: "select",
      options: JSON.stringify(["Bus", "Car"]),
      required: false,
      section: "Personal",
      visible: true,
      order: 1,
    });
    
    console.log("✅ Test field added successfully:", result);
    
    // Verify it was inserted
    const fields = await db.select().from(fieldsConfig).where(
      (f) => f.fieldKey === "transportation"
    );
    
    console.log("✅ Verification - Field found:", fields);
  } catch (error) {
    console.error("❌ Error adding test field:", error);
  }
}

addTestField();
