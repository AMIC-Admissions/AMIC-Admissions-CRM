import { getDb } from "./db";
import { students, seats } from "../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";

export async function fixFileComplete() {
  try {
    const database = (await getDb()) as any;
    
    // Get all students and update file_complete based on docs_signed AND requirements_submitted
    const allStudents = await database.select().from(students);
    
    for (const student of allStudents) {
      const fileComplete = (student.docsSigned === true) && (student.requirementsSubmitted === true);
      await database
        .update(students)
        .set({ fileComplete })
        .where(eq(students.id, student.id));
    }
    
    return { success: true, message: "File Complete fixed" };
  } catch (error) {
    console.error("Error fixing File Complete:", error);
    throw error;
  }
}

export async function fixSeatReserved() {
  try {
    const database = (await getDb()) as any;
    
    // Get all students and update seat_reserved based on conditions
    const allStudents = await database.select().from(students);
    
    for (const student of allStudents) {
      const isReRegistrationOrEnrollment = 
        student.studentType === "Re-Registration" || student.studentType === "Enrollment";
      
      const hasPayment = 
        student.firstInstallment === true ||
        student.secondInstallment === true ||
        student.fullPayment === true ||
        student.promissoryNote === true ||
        student.tamara === true ||
        student.jeelPay === true;
      
      const seatReserved = isReRegistrationOrEnrollment || hasPayment;
      
      await database
        .update(students)
        .set({ seatReserved })
        .where(eq(students.id, student.id));
    }
    
    return { success: true, message: "Seat Reserved fixed" };
  } catch (error) {
    console.error("Error fixing Seat Reserved:", error);
    throw error;
  }
}

export async function fixPaymentStatus() {
  try {
    const database = (await getDb()) as any;
    
    // Get all students and recalculate payment_status
    const allStudents = await database.select().from(students);
    
    for (const student of allStudents) {
      let paymentStatus: any = "Pending";
      
      if (student.fullPayment === true || student.tamara === true || student.jeelPay === true) {
        paymentStatus = "Paid";
      } else if (student.firstInstallment === true || student.secondInstallment === true || student.promissoryNote === true) {
        paymentStatus = "Partial";
      }
      
      await database
        .update(students)
        .set({ paymentStatus: paymentStatus as any })
        .where(eq(students.id, student.id));
    }
    
    return { success: true, message: "Payment Status fixed" };
  } catch (error) {
    console.error("Error fixing Payment Status:", error);
    throw error;
  }
}

export async function backfillNullValues() {
  try {
    const database = (await getDb()) as any;
    
    // Get all students and backfill NULL boolean fields with FALSE
    const allStudents = await database.select().from(students);
    
    for (const student of allStudents) {
      const updates: any = {};
      
      if (student.assessed === null) updates.assessed = false;
      if (student.passed === null) updates.passed = false;
      if (student.reAssessment === null) updates.reAssessment = false;
      if (student.passedRe === null) updates.passedRe = false;
      if (student.registration === null) updates.registration = false;
      if (student.enrollment === null) updates.enrollment = false;
      if (student.transfer === null) updates.transfer = false;
      if (student.firstInstallment === null) updates.firstInstallment = false;
      if (student.secondInstallment === null) updates.secondInstallment = false;
      if (student.fullPayment === null) updates.fullPayment = false;
      if (student.promissoryNote === null) updates.promissoryNote = false;
      if (student.tamara === null) updates.tamara = false;
      if (student.jeelPay === null) updates.jeelPay = false;
      if (student.docsSigned === null) updates.docsSigned = false;
      if (student.requirementsSubmitted === null) updates.requirementsSubmitted = false;
      if (student.fileComplete === null) updates.fileComplete = false;
      if (student.seatReserved === null) updates.seatReserved = false;
      
      if (Object.keys(updates).length > 0) {
        await database
          .update(students)
          .set(updates)
          .where(eq(students.id, student.id));
      }
    }
    
    return { success: true, message: "NULL values backfilled" };
  } catch (error) {
    console.error("Error backfilling NULL values:", error);
    throw error;
  }
}

export async function rebuildSeatsTable() {
  try {
    const database = (await getDb()) as any;
    
    // Clear existing seats
    await database.delete(seats).execute();
    
    // Get all students
    const allStudents = await database.select().from(students);
    
    // Group by school and grade
    const groupedBySchoolGrade = new Map<string, any[]>();
    
    for (const student of allStudents) {
      const key = `${student.school}|${student.grade}`;
      if (!groupedBySchoolGrade.has(key)) {
        groupedBySchoolGrade.set(key, []);
      }
      groupedBySchoolGrade.get(key)!.push(student);
    }
    
    // For each combination, calculate capacity and reserved seats
    groupedBySchoolGrade.forEach((studentList: any[], key: string) => {
      const [school, grade] = key.split("|");
      
      // Count reserved seats
      const reservedCount = studentList.filter(s => s.seatReserved === true).length;
      
      // Determine capacity based on school
      let capacity = 30;
      if (school === "Kids Gate") {
        capacity = 25;
      }
      
      // Insert into seats table
      database.insert(seats).values({
        school,
        grade,
        section: "A",
        capacity,
        reservedSeats: reservedCount,
      });
    });
    
    return { success: true, message: "Seats table rebuilt" };
  } catch (error) {
    console.error("Error rebuilding seats table:", error);
    throw error;
  }
}

export async function getDataConsistencyStatus() {
  try {
    const database = (await getDb()) as any;
    
    // Get statistics
    const allStudents = await database.select().from(students);
    const seatsData = await database.select().from(seats);
    
    const totalStudents = allStudents.length;
    const seatsReserved = allStudents.filter((s: any) => s.seatReserved === true).length;
    const paidStudents = allStudents.filter((s: any) => s.paymentStatus === "Paid").length;
    const fileCompleteStudents = allStudents.filter((s: any) => s.fileComplete === true).length;
    const seatsTableCount = seatsData.length;

    return {
      totalStudents,
      seatsReserved,
      paidStudents,
      fileCompleteStudents,
      seatsTableCount,
    };
  } catch (error) {
    console.error("Error getting data consistency status:", error);
    throw error;
  }
}

export async function runFullDataFix() {
  try {
    console.log("🔧 Starting full data consistency fix...\n");
    
    await fixFileComplete();
    console.log("✓ File Complete fixed");
    
    await fixSeatReserved();
    console.log("✓ Seat Reserved fixed");
    
    await fixPaymentStatus();
    console.log("✓ Payment Status fixed");
    
    await backfillNullValues();
    console.log("✓ NULL values backfilled");
    
    await rebuildSeatsTable();
    console.log("✓ Seats table rebuilt");
    
    const status = await getDataConsistencyStatus();
    console.log("\n✅ Data consistency fix completed!");
    console.log("📊 Summary:", status);
    
    return { success: true, status };
  } catch (error) {
    console.error("❌ Error during full data fix:", error);
    throw error;
  }
}
