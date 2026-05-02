import { getDb } from "./db";
import { students, seats } from "../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";

/**
 * Fix File Complete based on student type
 * - New Admission: requires docs_signed AND requirements_submitted
 * - Other types: defaults to TRUE
 */
export async function fixFileComplete() {
  try {
    const database = (await getDb()) as any;
    
    const allStudents = await database.select().from(students);
    
    for (const student of allStudents) {
      let fileComplete = false;
      
      if (student.studentType === "New Admission") {
        // New Admission: File Complete only if BOTH documents are signed
        fileComplete = (student.docsSigned === true) && (student.requirementsSubmitted === true);
      } else {
        // Other types (Re-Registration, Enrollment, Transfer): default to TRUE
        fileComplete = true;
      }
      
      await database
        .update(students)
        .set({ fileComplete })
        .where(eq(students.id, student.id));
    }
    
    return { success: true, message: "File Complete fixed (student-type-specific)" };
  } catch (error) {
    console.error("Error fixing File Complete:", error);
    throw error;
  }
}

/**
 * Fix Seat Reserved calculation
 * A student gets a seat reserved if:
 * 1. Student Type is Re-Registration or Enrollment, OR
 * 2. Any payment is completed (1st, 2nd, Full, Promissory, Tamara, JeelPay)
 */
export async function fixSeatReserved() {
  try {
    const database = (await getDb()) as any;
    
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
      
      // Reserve seat if either condition is true
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

/**
 * Fix Payment Status based on payment fields
 * - Paid: if full_payment OR tamara OR jeelPay
 * - Partial: if 1st_installment OR 2nd_installment OR promissory_note
 * - Pending: otherwise
 */
export async function fixPaymentStatus() {
  try {
    const database = (await getDb()) as any;
    
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

/**
 * Backfill NULL values with FALSE for all boolean fields
 */
export async function backfillNullValues() {
  try {
    const database = (await getDb()) as any;
    
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

/**
 * Rebuild seats table with accurate counts
 * - Clear existing seats
 * - Group students by school and grade
 * - Count reserved seats per school/grade
 * - Set capacity based on school type
 * - Insert new seat records
 */
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
      
      // Count reserved seats (only students with seatReserved = TRUE)
      const reservedCount = studentList.filter((s: any) => s.seatReserved === true).length;
      
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

/**
 * Get current data consistency status
 */
export async function getDataConsistencyStatus() {
  try {
    const database = (await getDb()) as any;
    
    // Get statistics
    const allStudents = await database.select().from(students);
    const seatsData = await database.select().from(seats);
    
    const totalStudents = allStudents.length;
    const seatsReserved = allStudents.filter((s: any) => s.seatReserved === true).length;
    const paidStudents = allStudents.filter((s: any) => s.paymentStatus === "Paid").length;
    const partialPayment = allStudents.filter((s: any) => s.paymentStatus === "Partial").length;
    const pendingPayment = allStudents.filter((s: any) => s.paymentStatus === "Pending").length;
    const fileCompleteStudents = allStudents.filter((s: any) => s.fileComplete === true).length;
    const newAdmissions = allStudents.filter((s: any) => s.studentType === "New Admission").length;
    const seatsTableCount = seatsData.length;
    
    // Calculate total capacity and available seats
    const totalCapacity = seatsData.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
    const totalReserved = seatsData.reduce((sum: number, s: any) => sum + (s.reservedSeats || 0), 0);
    const totalAvailable = totalCapacity - totalReserved;

    return {
      totalStudents,
      seatsReserved,
      paidStudents,
      partialPayment,
      pendingPayment,
      fileCompleteStudents,
      newAdmissions,
      seatsTableCount,
      totalCapacity,
      totalReserved,
      totalAvailable,
    };
  } catch (error) {
    console.error("Error getting data consistency status:", error);
    throw error;
  }
}

/**
 * Run full data consistency fix
 * Executes all fixes in sequence
 */
export async function runFullDataFix() {
  try {
    console.log("🔧 Starting full data consistency fix...\n");
    
    await fixFileComplete();
    console.log("✓ File Complete fixed (student-type-specific)");
    
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
