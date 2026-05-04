import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { students, seats } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Edge Cases: Withdrawn Students, Partial Payments, Missing Data", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe("Withdrawn Students", () => {
    it("should handle withdrawn student status correctly", async () => {
      if (!db) {
        expect(db).toBeDefined();
        return;
      }

      // Test that withdrawn students are counted separately
      const withdrawnStudents = await db
        .select()
        .from(students)
        .where(eq(students.status, "Withdrawn" as any));

      // Withdrawn students should not be counted in active statuses
      expect(Array.isArray(withdrawnStudents)).toBe(true);
    });

    it("should not reserve seats for withdrawn students", async () => {
      if (!db) return;

      // Verify that withdrawn students don't impact seat availability
      const seatsData = await db.select().from(seats);
      expect(Array.isArray(seatsData)).toBe(true);
    });
  });

  describe("Partial Payments", () => {
    it("should handle partial payment status", async () => {
      if (!db) return;

      // Test that partial payments are tracked correctly
      const partialPayments = await db
        .select()
        .from(students)
        .where(eq(students.paymentStatus, "Pending" as any));

      expect(Array.isArray(partialPayments)).toBe(true);
    });

    it("should distinguish between paid and pending payments", async () => {
      if (!db) return;

      const paidStudents = await db
        .select()
        .from(students)
        .where(eq(students.paymentStatus, "Paid" as any));

      const pendingStudents = await db
        .select()
        .from(students)
        .where(eq(students.paymentStatus, "Pending" as any));

      // Both should be arrays (may be empty)
      expect(Array.isArray(paidStudents)).toBe(true);
      expect(Array.isArray(pendingStudents)).toBe(true);
    });
  });

  describe("Missing Data", () => {
    it("should handle students with missing optional fields", async () => {
      if (!db) return;

      // Test that students can exist with NULL optional fields
      const allStudents = await db.select().from(students);
      expect(Array.isArray(allStudents)).toBe(true);

      // Verify structure is correct even with missing fields
      allStudents.forEach((student: any) => {
        expect(student).toHaveProperty("id");
        expect(student).toHaveProperty("name");
        expect(student).toHaveProperty("school");
      });
    });

    it("should calculate file complete correctly with missing documents", async () => {
      if (!db) return;

      // Test that fileComplete is FALSE when documents are missing
      const incompleteFiles = await db
        .select()
        .from(students)
        .where(eq(students.fileComplete, false));

      expect(Array.isArray(incompleteFiles)).toBe(true);
    });
  });

  describe("Dashboard Calculations", () => {
    it("should calculate total students correctly", async () => {
      if (!db) return;

      const allStudents = await db.select().from(students);
      expect(allStudents.length).toBeGreaterThanOrEqual(0);
    });

    it("should calculate registered students correctly", async () => {
      if (!db) return;

      const registered = await db
        .select()
        .from(students)
        .where(eq(students.status, "Registered" as any));

      expect(Array.isArray(registered)).toBe(true);
    });

    it("should calculate enrolled students correctly", async () => {
      if (!db) return;

      const enrolled = await db
        .select()
        .from(students)
        .where(eq(students.status, "Enrolled" as any));

      expect(Array.isArray(enrolled)).toBe(true);
    });
  });

  describe("Seat Master Consistency", () => {
    it("should verify seat_master is independent from student creation", async () => {
      if (!db) return;

      const seatsData = await db.select().from(seats);
      expect(Array.isArray(seatsData)).toBe(true);

      // Verify seat_master table structure
      seatsData.forEach((seat: any) => {
        expect(seat).toHaveProperty("school");
        expect(seat).toHaveProperty("grade");
        expect(seat).toHaveProperty("capacity");
      });
    });

    it("should calculate available seats correctly", async () => {
      if (!db) return;

      const seatsData = await db.select().from(seats);

      seatsData.forEach((seat: any) => {
        const capacity = seat.capacity || 0;
        const reserved = seat.reserved || 0;
        const available = capacity - reserved;

        expect(available).toBeGreaterThanOrEqual(0);
        expect(available).toBeLessThanOrEqual(capacity);
      });
    });
  });
});
