import { getDb } from "./server/_core/db";

async function checkDynamicValues() {
  const db = getDb();
  
  // Get the first student
  const student = await db.query.students.findFirst({
    where: (students, { eq }) => eq(students.id, 1)
  });
  
  console.log("Student:", student);
  
  // Get dynamic values for this student
  if (student) {
    const dynamicValues = await db.query.studentDynamicData.findMany({
      where: (sdd, { eq }) => eq(sdd.studentId, student.id)
    });
    
    console.log("Dynamic values for student:", dynamicValues);
  }
}

checkDynamicValues().catch(console.error);
