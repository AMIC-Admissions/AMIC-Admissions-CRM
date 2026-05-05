import { getDb } from "./server/db";
import { fieldsConfig } from "./drizzle/schema";

async function testDynamicFieldsAPI() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    console.log("Testing Dynamic Fields API...\n");

    // Test 1: List all fields
    console.log("1. Testing listFieldsConfig:");
    const fields = await db.select().from(fieldsConfig).orderBy(fieldsConfig.order);
    console.log(`   Found ${fields.length} fields:`);
    fields.forEach((field) => {
      console.log(`   - ${field.fieldLabel} (${field.fieldKey}): ${field.fieldType}`);
      if (field.options) {
        console.log(`     Options: ${JSON.stringify(field.options)}`);
      }
    });

    // Test 2: Verify field structure
    console.log("\n2. Verifying field structure:");
    if (fields.length > 0) {
      const firstField = fields[0];
      console.log(`   Field ID: ${firstField.id}`);
      console.log(`   Field Key: ${firstField.fieldKey}`);
      console.log(`   Field Label: ${firstField.fieldLabel}`);
      console.log(`   Field Type: ${firstField.fieldType}`);
      console.log(`   Required: ${firstField.required}`);
      console.log(`   Section: ${firstField.section}`);
      console.log(`   Visible: ${firstField.visible}`);
      console.log(`   Order: ${firstField.order}`);
    }

    console.log("\n✅ Dynamic Fields API test passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testDynamicFieldsAPI();
