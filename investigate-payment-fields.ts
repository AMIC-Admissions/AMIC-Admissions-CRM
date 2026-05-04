#!/usr/bin/env node

import { getDb } from "./server/db";
import { students as studentsTable } from "./drizzle/schema";

console.log("🔍 Investigating payment field data types and values...\n");

try {
  const db = (await getDb()) as any;
  
  // Get 10 sample students to check payment field types and values
  const samples = await db.select().from(studentsTable).limit(10);
  
  console.log("Sample students and their payment field values:\n");
  samples.forEach((s: any, i: number) => {
    console.log(`${i + 1}. ${s.name}`);
    console.log(`   studentType: ${s.studentType} (type: ${typeof s.studentType})`);
    console.log(`   firstInstallment: ${s.firstInstallment} (type: ${typeof s.firstInstallment})`);
    console.log(`   secondInstallment: ${s.secondInstallment} (type: ${typeof s.secondInstallment})`);
    console.log(`   fullPayment: ${s.fullPayment} (type: ${typeof s.fullPayment})`);
    console.log(`   promissoryNote: ${s.promissoryNote} (type: ${typeof s.promissoryNote})`);
    console.log(`   tamara: ${s.tamara} (type: ${typeof s.tamara})`);
    console.log(`   jeelPay: ${s.jeelPay} (type: ${typeof s.jeelPay})`);
    console.log(`   seatReserved: ${s.seatReserved} (type: ${typeof s.seatReserved})`);
    console.log();
  });
  
  // Count students by payment field values
  console.log("\n📊 Payment field value distribution:\n");
  
  const allStudents = await db.select().from(studentsTable);
  
  // Check firstInstallment values
  const firstInstallmentValues = new Set();
  allStudents.forEach((s: any) => {
    firstInstallmentValues.add(s.firstInstallment);
  });
  console.log("firstInstallment unique values:", Array.from(firstInstallmentValues));
  
  // Check secondInstallment values
  const secondInstallmentValues = new Set();
  allStudents.forEach((s: any) => {
    secondInstallmentValues.add(s.secondInstallment);
  });
  console.log("secondInstallment unique values:", Array.from(secondInstallmentValues));
  
  // Check fullPayment values
  const fullPaymentValues = new Set();
  allStudents.forEach((s: any) => {
    fullPaymentValues.add(s.fullPayment);
  });
  console.log("fullPayment unique values:", Array.from(fullPaymentValues));
  
  // Check promissoryNote values
  const promissoryNoteValues = new Set();
  allStudents.forEach((s: any) => {
    promissoryNoteValues.add(s.promissoryNote);
  });
  console.log("promissoryNote unique values:", Array.from(promissoryNoteValues));
  
  // Check tamara values
  const tamaraValues = new Set();
  allStudents.forEach((s: any) => {
    tamaraValues.add(s.tamara);
  });
  console.log("tamara unique values:", Array.from(tamaraValues));
  
  // Check jeelPay values
  const jeelPayValues = new Set();
  allStudents.forEach((s: any) => {
    jeelPayValues.add(s.jeelPay);
  });
  console.log("jeelPay unique values:", Array.from(jeelPayValues));
  
  // Count how many students SHOULD have seatReserved=TRUE based on logic
  let shouldReserve = 0;
  allStudents.forEach((s: any) => {
    const isReRegistration = s.studentType === "Re-Registration";
    const hasPayment = s.firstInstallment || s.secondInstallment || s.fullPayment || s.promissoryNote || s.tamara || s.jeelPay;
    if (isReRegistration || hasPayment) {
      shouldReserve++;
    }
  });
  
  console.log(`\n\n📈 Statistics:\n`);
  console.log(`Total students: ${allStudents.length}`);
  console.log(`Students with seatReserved=TRUE: ${allStudents.filter((s: any) => s.seatReserved === true).length}`);
  console.log(`Students that SHOULD have seatReserved=TRUE: ${shouldReserve}`);
  console.log(`Students with seatReserved=FALSE: ${allStudents.filter((s: any) => s.seatReserved === false).length}`);
  
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
