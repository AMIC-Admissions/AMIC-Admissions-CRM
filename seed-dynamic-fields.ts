import { getDb } from "./server/db";
import { fieldsConfig } from "./drizzle/schema";

async function seedDynamicFields() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    console.log("Seeding initial dynamic fields...");

    // Check if fields already exist
    const existingFields = await db.select().from(fieldsConfig);
    if (existingFields.length > 0) {
      console.log(`✅ Dynamic fields already seeded (${existingFields.length} fields found)`);
      return;
    }

    // Seed initial fields
    const initialFields = [
      {
        fieldKey: "gender",
        fieldLabel: "Gender",
        fieldType: "select" as const,
        options: [
          { label: "Male", value: "Male" },
          { label: "Female", value: "Female" },
        ],
        required: true,
        section: "general",
        visible: true,
        order: 1,
      },
      {
        fieldKey: "nationality",
        fieldLabel: "Nationality",
        fieldType: "select" as const,
        options: [
          { label: "Saudi", value: "Saudi" },
          { label: "Non-Saudi", value: "Non-Saudi" },
        ],
        required: false,
        section: "general",
        visible: true,
        order: 2,
      },
      {
        fieldKey: "student_type",
        fieldLabel: "Student Type",
        fieldType: "select" as const,
        options: [
          { label: "New Admission", value: "New Admission" },
          { label: "Enrollment", value: "Enrollment" },
          { label: "Re-Registration", value: "Re-Registration" },
          { label: "Transfer", value: "Transfer" },
        ],
        required: true,
        section: "enrollment",
        visible: true,
        order: 3,
      },
    ];

    for (const field of initialFields) {
      await db.insert(fieldsConfig).values(field);
      console.log(`✅ Seeded field: ${field.fieldLabel}`);
    }

    console.log("✅ Initial dynamic fields seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDynamicFields();
