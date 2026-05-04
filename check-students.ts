#!/usr/bin/env node

import { getDb } from "./server/db";
import { students as studentsTable } from "./drizzle/schema";
import { limit } from "drizzle-orm";

console.log("🔍 Checking student data...\n");

try {
  const db = (await getDb()) as any;
  
  // Get first 5 students to check their data
  const students = await db.select().from(studentsTable).limit(5);
  
  console.log("Sample students:");
  students.forEach((s: any, i: number) => {
    console.log(`\n${i + 1}. ${s.name}`);
    console.log(`   ID: ${s.id}`);
    console.log(`   studentType: ${s.studentType}`);
    console.log(`   school: ${s.school}`);
    console.log(`   grade: ${s.grade}`);
    console.log(`   section: ${s.section}`);
    console.log(`   seatReserved: ${s.seatReserved}`);
    console.log(`   firstInstallment: ${s.firstInstallment}`);
    console.log(`   secondInstallment: ${s.secondInstallment}`);
    console.log(`   fullPayment: ${s.fullPayment}`);
    console.log(`   tamara: ${s.tamara}`);
    console.log(`   jeelPay: ${s.jeelPay}`);
    console.log(`   promissoryNote: ${s.promissoryNote}`);
  });
  
  // Get count of students with seatReserved=true
  const { eq } = await import("drizzle-orm");
  const reserved = await db.select().from(studentsTable).where(eq(studentsTable.seatReserved, true));
  
  console.log(`\n\n📊 Total students with seatReserved=true: ${reserved.length}`);
  
  // Get count of students by studentType
  const allStudents = await db.select().from(studentsTable);
  const byType = new Map();
  allStudents.forEach((s: any) => {
    const type = s.studentType || 'NULL';
    byType.set(type, (byType.get(type) || 0) + 1);
  });
  
  console.log(`\n📋 Students by type:`);
  byType.forEach((count: number, type: string) => {
    console.log(`   ${type}: ${count}`);
  });
  
  console.log(`\n✅ Check completed!`);
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
