import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, assignSection, reserveSeat, releaseSeat, shouldReserveSeat, getDashboardData } from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { students, seats } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  admissions: router({
    // Get all students with filters
    listStudents: adminProcedure
      .input(
        z.object({
          school: z.string().optional(),
          grade: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().optional().default(100),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const conditions = [];
        if (input.school) conditions.push(eq(students.school, input.school));
        if (input.grade) conditions.push(eq(students.grade, input.grade));
        if (input.status) conditions.push(eq(students.status, input.status as any));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
          .select()
          .from(students)
          .where(whereClause)
          .limit(input.limit)
          .offset(input.offset);

        return result;
      }),

    // Create a new student
    createStudent: adminProcedure
      .input(
        z.object({
          studentId: z.string(),
          name: z.string(),
          gender: z.enum(["Male", "Female"]),
          nationality: z.string().optional(),
          school: z.string(),
          grade: z.string(),
          studentType: z.enum(["New", "Re-Registration", "Enrollment"]).default("New"),
          paymentStatus: z.enum(["Pending", "Paid"]).default("Pending"),
          paymentMethod: z.enum(["Cash", "Tamara", "JeelPay", "Promissory Note"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Assign section
        const sectionResult = await assignSection(input.school, input.grade, input.gender);
        if (!sectionResult.success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: sectionResult.message });
        }

        // Check if seat should be reserved
        const shouldReserve = shouldReserveSeat(input.studentType, input.paymentStatus, input.paymentMethod || null);

        // Try to reserve seat if needed
        if (shouldReserve) {
          const reserved = await reserveSeat(input.school, input.grade, sectionResult.section);
          if (!reserved) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "No seats available for this section" });
          }
        }

        // Create student
        const result = await db
          .insert(students)
          .values({
            ...input,
            section: sectionResult.section,
            seatReserved: shouldReserve,
          } as any);

        return { success: true, studentId: result[0] };
      }),

    // Update student
    updateStudent: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          gender: z.enum(["Male", "Female"]).optional(),
          nationality: z.string().optional(),
          school: z.string().optional(),
          grade: z.string().optional(),
          status: z.enum(["Registered", "Assessed", "Passed", "Enrolled", "Withdrawn"]).optional(),
          paymentStatus: z.enum(["Pending", "Paid"]).optional(),
          paymentMethod: z.enum(["Cash", "Tamara", "JeelPay", "Promissory Note"]).optional(),
          fileComplete: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { id, ...updateData } = input;

        // Get current student
        const currentStudent = await db
          .select()
          .from(students)
          .where(eq(students.id, id))
          .limit(1);

        if (currentStudent.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
        }

        const student = currentStudent[0];

        // Handle seat release if status changed to Withdrawn
        if (updateData.status === "Withdrawn" && student.status !== "Withdrawn" && student.seatReserved && student.section) {
          await releaseSeat(student.school, student.grade, student.section);
          (updateData as any).seatReserved = false;
        }

        // Handle seat reservation if payment conditions changed
        if (updateData.paymentStatus || updateData.paymentMethod) {
          const newPaymentStatus = updateData.paymentStatus || student.paymentStatus;
          const newPaymentMethod = updateData.paymentMethod || student.paymentMethod;
          const shouldReserve = shouldReserveSeat(student.studentType, newPaymentStatus, newPaymentMethod || null);

          if (shouldReserve && !student.seatReserved && student.section) {
            const reserved = await reserveSeat(student.school, student.grade, student.section);
            if (reserved) {
              (updateData as any).seatReserved = true;
            }
          }
        }

        await db.update(students).set(updateData as any).where(eq(students.id, id));

        return { success: true };
      }),

    // Delete student
    deleteStudent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Get student to release seat if reserved
        const student = await db
          .select()
          .from(students)
          .where(eq(students.id, input.id))
          .limit(1);

        if (student.length > 0 && student[0].seatReserved && student[0].section) {
          await releaseSeat(student[0].school, student[0].grade, student[0].section);
        }

        await db.delete(students).where(eq(students.id, input.id));

        return { success: true };
      }),

    // Get seats with utilization
    listSeats: adminProcedure
      .input(
        z.object({
          school: z.string().optional(),
          grade: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const conditions = [];
        if (input.school) conditions.push(eq(seats.school, input.school));
        if (input.grade) conditions.push(eq(seats.grade, input.grade));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await db
          .select()
          .from(seats)
          .where(whereClause)
          .orderBy(seats.school, seats.grade, seats.section);

        return result.map(seat => ({
          ...seat,
          availableSeats: (seat.capacity ?? 0) - (seat.reservedSeats ?? 0),
          reserved: seat.reservedSeats,
          available: (seat.capacity ?? 0) - (seat.reservedSeats ?? 0),
          lowSeatAlert: ((seat.capacity ?? 0) - (seat.reservedSeats ?? 0)) <= 3,
        }));
      }),

    // Update seat capacity
    updateSeat: adminProcedure
      .input(
        z.object({
          id: z.number(),
          capacity: z.number().optional(),
          reservedSeats: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { id, ...updateData } = input;

        await db.update(seats).set(updateData).where(eq(seats.id, id));

        return { success: true };
      }),

    // Get dashboard data
    getDashboard: adminProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          school: z.string().optional(),
          grade: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getDashboardData(input);
      }),

    // Get unique schools and grades for filters
    getFilterOptions: adminProcedure
      .input(z.object({}).optional())
      .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const schoolsResult = await db
        .selectDistinct({ school: students.school })
        .from(students);
      const gradesResult = await db
        .selectDistinct({ grade: students.grade })
        .from(students);

      return {
        schools: schoolsResult.map((s: any) => s.school).filter(Boolean),
        grades: gradesResult.map((g: any) => g.grade).filter(Boolean),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
