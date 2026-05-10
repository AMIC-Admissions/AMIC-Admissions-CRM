import { getDb } from "./server/db.ts";

async function test() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("Database unavailable");
      return;
    }
    
    console.log("Database connected successfully");
    
    // Try to insert a test student
    const result = await db.insert(students).values({
      studentId: "TEST-" + Date.now(),
      name: "Test Student",
      gender: "Male",
      nationality: "Saudi",
      school: "AMIS Girls",
      grade: "Grade 1",
      studentType: "New Admission",
      status: "Registered",
      paymentStatus: "Pending",
    });
    
    console.log("Insert result:", result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
