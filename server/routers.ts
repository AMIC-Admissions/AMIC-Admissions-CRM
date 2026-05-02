import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, assignSection, reserveSeat, releaseSeat, shouldReserveSeat, getDashboardData } from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { students, seats } from "../drizzle/schema";
import { eq, and, sql, like } from "drizzle-orm";

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

    // Search students by ID, Name, Grade, or Nationality
    searchStudents: adminProcedure
      .input(
        z.object({
          query: z.string().min(1),
          limit: z.number().optional().default(20),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const searchPattern = `%${input.query}%`;
        const result = await db
          .select()
          .from(students)
          .where(
            sql`
              ${students.studentId} LIKE ${searchPattern} OR
              ${students.name} LIKE ${searchPattern} OR
              ${students.grade} LIKE ${searchPattern} OR
              ${students.nationality} LIKE ${searchPattern}
            `
          )
          .limit(input.limit);

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

        // Create student
        const newStudent = await db.insert(students).values({
          studentId: input.studentId,
          name: input.name,
          gender: input.gender,
          nationality: input.nationality,
          school: input.school,
          grade: input.grade,
          section: sectionResult.section,
          studentType: input.studentType,
          paymentStatus: input.paymentStatus,
          paymentMethod: input.paymentMethod,
          seatReserved: shouldReserve,
          status: "Registered",
        });

        // Reserve seat if needed
        if (shouldReserve) {
          await reserveSeat(input.school, input.grade, sectionResult.section!);
        }

        return newStudent;
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

        const student = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
        if (student.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
        }

        const currentStudent = student[0];

        // Handle seat release on withdrawal
        if (input.status === "Withdrawn" && currentStudent.seatReserved && currentStudent.section) {
          await releaseSeat(currentStudent.school, currentStudent.grade, currentStudent.section);
        }

        // Update student
        await db.update(students).set({
          name: input.name || currentStudent.name,
          gender: input.gender || currentStudent.gender,
          nationality: input.nationality !== undefined ? input.nationality : currentStudent.nationality,
          school: input.school || currentStudent.school,
          grade: input.grade || currentStudent.grade,
          status: input.status || currentStudent.status,
          paymentStatus: input.paymentStatus || currentStudent.paymentStatus,
          paymentMethod: input.paymentMethod || currentStudent.paymentMethod,
          fileComplete: input.fileComplete !== undefined ? input.fileComplete : currentStudent.fileComplete,
        }).where(eq(students.id, input.id));

        return { success: true };
      }),

    // Delete student
    deleteStudent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const student = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
        if (student.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
        }

        const currentStudent = student[0];

        // Release seat if reserved
        if (currentStudent.seatReserved && currentStudent.section) {
          await releaseSeat(currentStudent.school, currentStudent.grade, currentStudent.section);
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

        const result = await db.select().from(seats).where(whereClause);

        return result.map((seat) => ({
          ...seat,
          available: (seat.capacity || 0) - (seat.reservedSeats || 0),
        }));
      }),

    // Get seat availability for a specific school, grade, and gender
    getSeatAvailability: adminProcedure
      .input(
        z.object({
          school: z.string(),
          grade: z.string(),
          gender: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Get seats for this school and grade
        const seatsResult = await db
          .select()
          .from(seats)
          .where(and(eq(seats.school, input.school), eq(seats.grade, input.grade)));

        if (seatsResult.length === 0) {
          return {
            capacity: 0,
            reserved: 0,
            available: 0,
            sections: [],
          };
        }

        // Calculate totals
        const totalCapacity = seatsResult.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalReserved = seatsResult.reduce((sum, s) => sum + (s.reservedSeats || 0), 0);
        const totalAvailable = totalCapacity - totalReserved;

        return {
          capacity: totalCapacity,
          reserved: totalReserved,
          available: totalAvailable,
          sections: seatsResult,
        };
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

    // Get comprehensive dashboard data with all analytics
    getComprehensiveDashboard: adminProcedure
      .input(
        z.object({
          school: z.string().optional(),
          grade: z.string().optional(),
          from: z.date().optional(),
          to: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Build conditions
        const conditions = [];
        if (input.school) conditions.push(eq(students.school, input.school));
        if (input.grade) conditions.push(eq(students.grade, input.grade));
        if (input.from) conditions.push(sql`${students.registrationDate} >= ${input.from}`);
        if (input.to) conditions.push(sql`${students.registrationDate} <= ${input.to}`);

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get all students matching filters
        const allStudents = await db.select().from(students).where(whereClause);

        // Calculate KPIs
        const totalStudents = allStudents.length;
        const passed = allStudents.filter((s) => s.status === "Passed").length;
        const failed = allStudents.filter((s) => s.status === "Withdrawn").length;
        const registered = allStudents.filter((s) => s.status === "Registered").length;
        const enrolled = allStudents.filter((s) => s.status === "Enrolled").length;

        // Get seat data
        const allSeats = await db.select().from(seats);
        const totalSeatsReserved = allSeats.reduce((sum, s) => sum + (s.reservedSeats || 0), 0);
        const totalCapacity = allSeats.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalAvailable = totalCapacity - totalSeatsReserved;

        // School breakdown
        const schoolBreakdown = Object.entries(
          allStudents.reduce(
            (acc, student) => {
              if (!acc[student.school]) {
                acc[student.school] = {
                  school: student.school,
                  assessed: 0,
                  passed: 0,
                  registered: 0,
                  firstInstallment: 0,
                  enrollment: 0,
                  promissoryNote: 0,
                  jeelPay: 0,
                  tamara: 0,
                  seatsReserved: 0,
                };
              }
              if (student.status === "Assessed") acc[student.school].assessed++;
              if (student.status === "Passed") acc[student.school].passed++;
              if (student.status === "Registered") acc[student.school].registered++;
              if (student.paymentMethod === "Cash") acc[student.school].firstInstallment++;
              if (student.paymentMethod === "Tamara") acc[student.school].tamara++;
              if (student.paymentMethod === "JeelPay") acc[student.school].jeelPay++;
              if (student.seatReserved) acc[student.school].seatsReserved++;
              return acc;
            },
            {} as Record<string, any>
          )
        ).map(([, value]) => value);

        // Payment summary
        const paymentSummary = {
          firstInstallment: allStudents.filter((s) => s.paymentMethod === "Cash").length,
          fullPayment: allStudents.filter((s) => s.paymentStatus === "Paid").length,
          promissoryNote: 0,
          jeelPay: allStudents.filter((s) => s.paymentMethod === "JeelPay").length,
          tamara: allStudents.filter((s) => s.paymentMethod === "Tamara").length,
          noPayment: allStudents.filter((s) => s.paymentStatus === "Pending").length,
        };

        // Seat summary by grade
        const seatsByGrade = Object.entries(
          allSeats.reduce(
            (acc, seat) => {
              if (!acc[seat.grade]) {
                acc[seat.grade] = {
                  grade: seat.grade,
                  totalCapacity: 0,
                  registered: 0,
                  reserved: 0,
                  available: 0,
                };
              }
              acc[seat.grade].totalCapacity += seat.capacity || 0;
              acc[seat.grade].reserved += seat.reservedSeats || 0;
              return acc;
            },
            {} as Record<string, any>
          )
        ).map(([, value]) => ({
          ...value,
          registered: allStudents.filter((s) => s.grade === value.grade && s.status === "Registered").length,
          available: value.totalCapacity - value.reserved,
        }));

        return {
          kpis: {
            totalStudents,
            passed,
            failed,
            registered,
            enrolled,
            seatsReserved: totalSeatsReserved,
            seatsAvailable: totalAvailable,
          },
          schoolBreakdown,
          paymentSummary,
          seatsByGrade,
          alerts: totalAvailable <= 3 ? [{ type: "warning", message: "⚠️ Seats Almost Full" }] : [],
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
