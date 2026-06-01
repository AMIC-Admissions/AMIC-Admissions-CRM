import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { dynamicFieldsRouter } from "./dynamicFieldsRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, assignSection, reserveSeat, releaseSeat, shouldReserveSeat, getDashboardData, getSeatAvailabilityRows, getSeatFilterOptions } from "./db";
import { generateReport, getReportFilterOptions } from "./reports";
import { saveReportTemplate, getUserTemplates, getTemplate, deleteTemplate, updateTemplate } from "./reportTemplates";
import { applyMigration0004, checkMigrationStatus } from "./migrations";
import { ReportFilter, ReportFieldOption } from "@shared/reportTypes";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { students, seats } from "../drizzle/schema";
import { eq, and, sql, like } from "drizzle-orm";
import { writeAuditLog, diffObjects } from "./auditService";

export const appRouter = router({
  system: systemRouter,
  dynamicFields: dynamicFieldsRouter,
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
          grade:  z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
          limit:  z.number().min(1).max(200).optional().default(25),
          offset: z.number().min(0).optional().default(0),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const conditions = [];
        if (input.school) conditions.push(eq(students.school, input.school));
        if (input.grade)  conditions.push(eq(students.grade,  input.grade));
        if (input.status) conditions.push(eq(students.status, input.status as any));
        if (input.search) {
          const pattern = `%${input.search}%`;
          conditions.push(
            sql`(${students.name} LIKE ${pattern} OR ${students.studentId} LIKE ${pattern} OR ${students.fatherMobile} LIKE ${pattern} OR ${students.motherMobile} LIKE ${pattern} OR ${students.grade} LIKE ${pattern} OR ${students.school} LIKE ${pattern})`
          );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [rows, countRows] = await Promise.all([
          db.select().from(students).where(whereClause)
            .limit(input.limit).offset(input.offset),
          db.select({ total: sql<number>`COUNT(*)` }).from(students).where(whereClause),
        ]);

        return {
          data:   rows,
          total:  countRows[0]?.total ?? 0,
          limit:  input.limit,
          offset: input.offset,
        };
      }),

    // Search students by ID, name, mobile, grade, or school
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
              ${students.fatherMobile} LIKE ${searchPattern} OR
              ${students.motherMobile} LIKE ${searchPattern} OR
              ${students.grade} LIKE ${searchPattern} OR
              ${students.school} LIKE ${searchPattern}
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
          dateOfBirth: z.string().optional(),
          gender: z.enum(["Male", "Female"]),
          nationality: z.enum(["Saudi", "Non-Saudi"]).optional(),
          school: z.string(),
          grade: z.string(),
          section: z.string().optional(),
          studentType: z.enum(["New Admission", "Enrollment", "Re-Registration", "Transfer"]).default("New Admission"),
          dateOfJoin: z.string().optional(),
          assessed: z.boolean().optional(),
          passed: z.boolean().optional(),
          reAssessment: z.boolean().optional(),
          passedRe: z.boolean().optional(),
          registration: z.boolean().optional(),
          enrollment: z.boolean().optional(),
          transfer: z.boolean().optional(),
          firstInstallment: z.boolean().optional(),
          secondInstallment: z.boolean().optional(),
          fullPayment: z.boolean().optional(),
          promissoryNote: z.boolean().optional(),
          tamara: z.boolean().optional(),
          jeelPay: z.boolean().optional(),
          docsSigned: z.boolean().optional(),
          requirementsSubmitted: z.boolean().optional(),
          fatherId: z.string().optional(),
          fatherMobile: z.string().optional(),
          motherId: z.string().optional(),
          motherMobile: z.string().optional(),
          notes: z.string().optional(),
          status: z.enum(["Registered", "Assessed", "Passed", "Enrolled", "Withdrawn"]).optional(),
          fileComplete: z.boolean().optional(),
          paymentStatus: z.enum(["Pending", "Partial", "Paid"]).default("Pending"),
          paymentMethod: z.enum(["Cash", "Bank Transfer", "Card", "Tamara", "JeelPay", "Promissory Note"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Assign section
        const requestedSection = input.section?.trim();
        const sectionResult = requestedSection
          ? { section: requestedSection, success: true, message: "Section provided" }
          : await assignSection(input.school, input.grade, input.gender);
        if (!sectionResult.success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: sectionResult.message });
        }

        // Check if seat should be reserved
        const shouldReserve = shouldReserveSeat(
          input.studentType,
          input.paymentStatus,
          input.paymentMethod || null,
          input.firstInstallment,
          input.secondInstallment,
          input.fullPayment,
          input.promissoryNote,
          input.tamara,
          input.jeelPay
        );

        // Create student
        const newStudent = await db.insert(students).values({
          studentId: input.studentId,
          name: input.name,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          nationality: input.nationality,
          school: input.school,
          grade: input.grade,
          section: sectionResult.section,
          studentType: input.studentType,
          dateOfJoin: input.dateOfJoin,
          assessed: input.assessed || false,
          passed: input.passed || false,
          reAssessment: input.reAssessment || false,
          passedRe: input.passedRe || false,
          registration: input.registration || false,
          enrollment: input.enrollment || false,
          transfer: input.transfer || false,
          paymentStatus: input.paymentStatus,
          paymentMethod: input.paymentMethod,
          firstInstallment: input.firstInstallment || false,
          secondInstallment: input.secondInstallment || false,
          fullPayment: input.fullPayment || false,
          promissoryNote: input.promissoryNote || false,
          tamara: input.tamara || false,
          jeelPay: input.jeelPay || false,
          docsSigned: input.docsSigned || false,
          requirementsSubmitted: input.requirementsSubmitted || false,
          fileComplete: input.fileComplete ?? (!!input.docsSigned && !!input.requirementsSubmitted),
          fatherId: input.fatherId,
          fatherMobile: input.fatherMobile,
          motherId: input.motherId,
          motherMobile: input.motherMobile,
          seatReserved: shouldReserve,
          notes: input.notes,
          status: input.status || "Registered",
        } as any);

        // Reserve seat if needed
        if (shouldReserve) {
          await reserveSeat(input.school, input.grade, sectionResult.section!);
        }

        // Audit log
        const insertId = (newStudent as any).insertId;
        await writeAuditLog({
          action:        "create",
          studentId:     insertId ?? null,
          studentName:   input.name,
          studentSid:    input.studentId,
          performedBy:   ctx.user?.id ?? null,
          performedName: ctx.user?.name ?? ctx.user?.email ?? null,
        });

        return newStudent;
      }),

    // Update student
    updateStudent: adminProcedure
      .input(
        z.object({
          id: z.number(),
          studentId: z.string().optional(),
          name: z.string().optional(),
          dateOfBirth: z.string().optional(),
          gender: z.enum(["Male", "Female"]).optional(),
          nationality: z.string().optional(),
          school: z.string().optional(),
          grade: z.string().optional(),
          section: z.string().optional(),
          studentType: z.string().optional(),
          dateOfJoin: z.string().optional(),
          assessed: z.boolean().optional(),
          passed: z.boolean().optional(),
          reAssessment: z.boolean().optional(),
          passedRe: z.boolean().optional(),
          registration: z.boolean().optional(),
          enrollment: z.boolean().optional(),
          transfer: z.boolean().optional(),
          status: z.enum(["Registered", "Assessed", "Passed", "Enrolled", "Withdrawn"]).optional(),
          paymentStatus: z.enum(["Pending", "Partial", "Paid"]).optional(),
          paymentMethod: z.enum(["Cash", "Bank Transfer", "Card", "Tamara", "JeelPay", "Promissory Note"]).optional(),
          fileComplete: z.boolean().optional(),
          firstInstallment: z.boolean().optional(),
          secondInstallment: z.boolean().optional(),
          fullPayment: z.boolean().optional(),
          promissoryNote: z.boolean().optional(),
          tamara: z.boolean().optional(),
          jeelPay: z.boolean().optional(),
          docsSigned: z.boolean().optional(),
          requirementsSubmitted: z.boolean().optional(),
          fatherId: z.string().optional(),
          fatherMobile: z.string().optional(),
          motherId: z.string().optional(),
          motherMobile: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const student = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
        if (student.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
        }

        const currentStudent = student[0];

        // Build update object
        const updateData: any = {};
        if (input.studentId !== undefined) updateData.studentId = input.studentId;
        if (input.name !== undefined) updateData.name = input.name;
        if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
        if (input.gender !== undefined) updateData.gender = input.gender;
        if (input.nationality !== undefined) updateData.nationality = input.nationality;
        if (input.school !== undefined) updateData.school = input.school;
        if (input.grade !== undefined) updateData.grade = input.grade;
        if (input.section !== undefined) updateData.section = input.section;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.paymentStatus !== undefined) updateData.paymentStatus = input.paymentStatus;
        if (input.paymentMethod !== undefined) updateData.paymentMethod = input.paymentMethod;
        if (input.dateOfJoin !== undefined) updateData.dateOfJoin = input.dateOfJoin;
        if (input.fileComplete !== undefined) updateData.fileComplete = input.fileComplete;
        
        // Handle workflow, payment, document, and contact fields
        if (input.assessed !== undefined) updateData.assessed = input.assessed;
        if (input.passed !== undefined) updateData.passed = input.passed;
        if (input.reAssessment !== undefined) updateData.reAssessment = input.reAssessment;
        if (input.passedRe !== undefined) updateData.passedRe = input.passedRe;
        if (input.registration !== undefined) updateData.registration = input.registration;
        if (input.enrollment !== undefined) updateData.enrollment = input.enrollment;
        if (input.transfer !== undefined) updateData.transfer = input.transfer;
        if (input.firstInstallment !== undefined) updateData.firstInstallment = input.firstInstallment;
        if (input.secondInstallment !== undefined) updateData.secondInstallment = input.secondInstallment;
        if (input.fullPayment !== undefined) updateData.fullPayment = input.fullPayment;
        if (input.promissoryNote !== undefined) updateData.promissoryNote = input.promissoryNote;
        if (input.tamara !== undefined) updateData.tamara = input.tamara;
        if (input.jeelPay !== undefined) updateData.jeelPay = input.jeelPay;
        if (input.docsSigned !== undefined) updateData.docsSigned = input.docsSigned;
        if (input.requirementsSubmitted !== undefined) updateData.requirementsSubmitted = input.requirementsSubmitted;
        if (input.fatherId !== undefined) updateData.fatherId = input.fatherId;
        if (input.fatherMobile !== undefined) updateData.fatherMobile = input.fatherMobile;
        if (input.motherId !== undefined) updateData.motherId = input.motherId;
        if (input.motherMobile !== undefined) updateData.motherMobile = input.motherMobile;
        if (input.notes !== undefined) updateData.notes = input.notes;
        if (input.studentType !== undefined) updateData.studentType = input.studentType;

        if (
          input.fileComplete === undefined &&
          (input.docsSigned !== undefined || input.requirementsSubmitted !== undefined)
        ) {
          const docsSigned = input.docsSigned !== undefined ? input.docsSigned : currentStudent.docsSigned;
          const requirementsSubmitted = input.requirementsSubmitted !== undefined
            ? input.requirementsSubmitted
            : currentStudent.requirementsSubmitted;
          updateData.fileComplete = docsSigned && requirementsSubmitted;
        }

        if ((input.school !== undefined || input.grade !== undefined || input.gender !== undefined) && input.section === undefined) {
          const sectionResult = await assignSection(
            input.school || currentStudent.school,
            input.grade || currentStudent.grade,
            (input.gender || currentStudent.gender) as "Male" | "Female"
          );
          if (!sectionResult.success) {
            throw new TRPCError({ code: "BAD_REQUEST", message: sectionResult.message });
          }
          updateData.section = sectionResult.section;
        }

        // Recalculate seatReserved based on updated values
        const studentType = input.studentType || currentStudent.studentType;
        const paymentStatus = input.paymentStatus !== undefined ? input.paymentStatus : currentStudent.paymentStatus;
        const paymentMethod = input.paymentMethod !== undefined ? input.paymentMethod : currentStudent.paymentMethod;
        const firstInstallment = input.firstInstallment !== undefined ? input.firstInstallment : currentStudent.firstInstallment;
        const secondInstallment = input.secondInstallment !== undefined ? input.secondInstallment : currentStudent.secondInstallment;
        const fullPayment = input.fullPayment !== undefined ? input.fullPayment : currentStudent.fullPayment;
        const promissoryNote = input.promissoryNote !== undefined ? input.promissoryNote : currentStudent.promissoryNote;
        const tamara = input.tamara !== undefined ? input.tamara : currentStudent.tamara;
        const jeelPay = input.jeelPay !== undefined ? input.jeelPay : currentStudent.jeelPay;
        const targetSchool = input.school || currentStudent.school;
        const targetGrade = input.grade || currentStudent.grade;
        const targetSection = updateData.section ?? currentStudent.section;
        const isWithdrawn = (input.status || currentStudent.status) === "Withdrawn";

        const newSeatReserved = !isWithdrawn && shouldReserveSeat(
          studentType,
          paymentStatus,
          paymentMethod,
          firstInstallment,
          secondInstallment,
          fullPayment,
          promissoryNote,
          tamara,
          jeelPay
        );

        const oldSeatReserved = currentStudent.seatReserved;
        updateData.seatReserved = newSeatReserved;

        // Handle seat reservation/release changes
        const seatLocationChanged =
          targetSchool !== currentStudent.school ||
          targetGrade !== currentStudent.grade ||
          targetSection !== currentStudent.section;
        if (oldSeatReserved && (!newSeatReserved || seatLocationChanged) && currentStudent.section) {
          await releaseSeat(currentStudent.school, currentStudent.grade, currentStudent.section);
        }
        if (newSeatReserved && (!oldSeatReserved || seatLocationChanged) && targetSection) {
          await reserveSeat(targetSchool, targetGrade, targetSection);
        }

        await db.update(students).set(updateData).where(eq(students.id, input.id));

        // Audit log — diff before vs after
        const changes = diffObjects(
          currentStudent as Record<string, unknown>,
          { ...currentStudent, ...updateData }
        );
        if (Object.keys(changes).length > 0) {
          await writeAuditLog({
            action:        "update",
            studentId:     input.id,
            studentName:   currentStudent.name,
            studentSid:    currentStudent.studentId,
            performedBy:   ctx.user?.id ?? null,
            performedName: ctx.user?.name ?? ctx.user?.email ?? null,
            changes,
          });
        }

        return { success: true };
      }),

    // Delete student
    deleteStudent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const student = await db.select().from(students).where(eq(students.id, input.id)).limit(1);
        if (student.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
        }

        // Release seat if reserved
        if (student[0].seatReserved) {
          await releaseSeat(student[0].school, student[0].grade, student[0].section!);
        }

        await db.delete(students).where(eq(students.id, input.id));

        // Audit log — store full snapshot before deletion
        await writeAuditLog({
          action:        "delete",
          studentId:     null,
          studentName:   student[0].name,
          studentSid:    student[0].studentId,
          performedBy:   ctx.user?.id ?? null,
          performedName: ctx.user?.name ?? ctx.user?.email ?? null,
          snapshot:      student[0],
        });

        return { success: true };
      }),

    // List seats with availability
    listSeats: adminProcedure.query(async () => {
      return await getSeatAvailabilityRows();
    }),

    // Get seat availability for a specific school/grade/gender
    getSeatAvailability: adminProcedure
      .input(
        z.object({
          school: z.string(),
          grade: z.string(),
          gender: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const seatsResult = await getSeatAvailabilityRows(input);

        const totalCapacity = seatsResult.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalReserved = seatsResult.reduce((sum, s) => sum + (s.reserved || 0), 0);
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
          from: z.date().optional(),
          to: z.date().optional(),
          school: z.string().optional(),
          grade: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getDashboardData(input);
      }),

    // Get unique schools and grades for filters
    getFilterOptions: adminProcedure
      .input(z.void().optional())
      .query(async () => {
        return await getSeatFilterOptions();
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

    // Generate report with dynamic filters and field selection
    generateReport: adminProcedure
      .input(
        z.object({
          filters: z.record(z.string(), z.any()).optional(),
          selectedFields: z.array(z.string()),
          limit: z.number().optional().default(1000),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        return await generateReport(
          (input.filters as any) || {},
          input.selectedFields as any,
          input.limit,
          input.offset
        );
      }),

    // Get filter options for report UI
    getReportFilterOptions: adminProcedure.query(async () => {
      return await getReportFilterOptions();
    }),

    // Save a report template
    saveTemplate: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          filters: z.record(z.string(), z.any()).optional(),
          selectedFields: z.array(z.string()),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return await saveReportTemplate(
          ctx.user.id,
          input.name,
          input.description,
          (input.filters as any) || {},
          input.selectedFields as ReportFieldOption[]
        );
      }),

    // Get all templates for current user
    getTemplates: adminProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await getUserTemplates(ctx.user.id);
    }),

    // Get a specific template
    getTemplate: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return await getTemplate(ctx.user.id, input.id);
      }),

    // Delete a template
    deleteTemplate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        await deleteTemplate(ctx.user.id, input.id);
        return { success: true };
      }),

    // Update a template
    updateTemplate: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1),
          description: z.string().optional(),
          filters: z.record(z.string(), z.any()).optional(),
          selectedFields: z.array(z.string()),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return await updateTemplate(
          ctx.user.id,
          input.id,
          input.name,
          input.description,
          (input.filters as any) || {},
          input.selectedFields as ReportFieldOption[]
        );
      }),
  }),

  admin: router({
    // Migration endpoints
    checkMigration: adminProcedure.query(async () => {
      const status = await checkMigrationStatus();
      return status;
    }),

    applyMigration: adminProcedure.mutation(async () => {
      const result = await applyMigration0004();
      return result;
    }),

    getDataStatus: adminProcedure.query(async () => {
      const { getDataConsistencyStatus } = await import("./dataFix");
      return await getDataConsistencyStatus();
    }),

    fixDataConsistency: adminProcedure.mutation(async () => {
      const { runFullDataFix } = await import("./dataFix");
      return await runFullDataFix();
    }),

    applySeatMasterMigration: adminProcedure.mutation(async () => {
      const { applySeatMasterMigration } = await import("./seatMasterMigration");
      return await applySeatMasterMigration();
    }),

    getSeatMasterStatus: adminProcedure.query(async () => {
      const { getSeatMasterStatus } = await import("./seatMasterMigration");
      return await getSeatMasterStatus();
    }),

    getSeatAvailability: publicProcedure.query(async () => {
      const { getSeatAvailability } = await import("./seatCalculations");
      return await getSeatAvailability();
    }),

    getAllSeats: publicProcedure.query(async () => {
      return await getSeatAvailabilityRows();
    }),

    getLowAvailabilitySeats: publicProcedure.query(async () => {
      const { getLowAvailabilitySeats } = await import("./seatCalculations");
      return await getLowAvailabilitySeats();
    }),

    getAlerts: adminProcedure.query(async () => {
      const db = await getDb();

      // ── Low-seat alerts (available ≤ 3) ──
      let lowSeatAlerts: { school: string; grade: string; section: string; available: number; capacity: number }[] = [];
      try {
        const { getSeatAvailability } = await import("./seatCalculations");
        const result = await getSeatAvailability();
        if (result.success) {
          lowSeatAlerts = (result.seats as any[])
            .filter((s: any) => s.available <= 3 && s.capacity > 0)
            .map((s: any) => ({
              school: s.school, grade: s.grade, section: s.section,
              available: s.available, capacity: s.capacity,
            }));
        }
      } catch (_) {}

      // ── Incomplete file alerts ──
      let incompleteFiles: { id: number; name: string; studentId: string; school: string; grade: string }[] = [];
      if (db) {
        try {
          const rows = await db
            .select({
              id: students.id, name: students.name,
              studentId: students.studentId,
              school: students.school, grade: students.grade,
            })
            .from(students)
            .where(eq(students.fileComplete, false))
            .limit(50);
          incompleteFiles = rows;
        } catch (_) {}
      }

      return {
        lowSeatAlerts,
        incompleteFiles,
        totalCount: lowSeatAlerts.length + incompleteFiles.length,
      };
    }),

    /* ── Audit Log ── */
    listAuditLog: adminProcedure
      .input(z.object({
        studentId:  z.number().optional(),
        action:     z.enum(["create", "update", "delete"]).optional(),
        performedBy:z.number().optional(),
        dateFrom:   z.string().optional(),
        dateTo:     z.string().optional(),
        search:     z.string().optional(),
        limit:      z.number().min(1).max(200).optional().default(50),
        offset:     z.number().min(0).optional().default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { data: [], total: 0 };
        const { auditLog } = await import("../drizzle/schema");
        const { desc, gte, lte } = await import("drizzle-orm");

        const conds: any[] = [];
        if (input.studentId)   conds.push(eq(auditLog.studentId,   input.studentId));
        if (input.action)      conds.push(eq(auditLog.action,      input.action));
        if (input.performedBy) conds.push(eq(auditLog.performedBy, input.performedBy));
        if (input.dateFrom)    conds.push(gte(auditLog.createdAt, new Date(input.dateFrom)));
        if (input.dateTo) {
          const d = new Date(input.dateTo); d.setHours(23, 59, 59, 999);
          conds.push(lte(auditLog.createdAt, d));
        }
        if (input.search) {
          const p = `%${input.search}%`;
          conds.push(sql`(${auditLog.studentName} LIKE ${p} OR ${auditLog.studentSid} LIKE ${p} OR ${auditLog.performedName} LIKE ${p})`);
        }

        const where = conds.length > 0 ? and(...conds) : undefined;

        const [rows, countRows] = await Promise.all([
          db.select().from(auditLog).where(where)
            .orderBy(desc(auditLog.createdAt))
            .limit(input.limit).offset(input.offset),
          db.select({ total: sql<number>`COUNT(*)` }).from(auditLog).where(where),
        ]);

        return { data: rows, total: countRows[0]?.total ?? 0 };
      }),

    /* ── Report Schedule CRUD ── */
    listSchedules: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { reportSchedules } = await import("../drizzle/schema");
      return db.select().from(reportSchedules).orderBy(reportSchedules.createdAt);
    }),

    createSchedule: adminProcedure
      .input(z.object({
        name:       z.string().min(1).max(120),
        frequency:  z.enum(["daily", "weekly"]),
        dayOfWeek:  z.number().min(0).max(6).nullable().optional(),
        hour:       z.number().min(0).max(23),
        recipients: z.array(z.string().email()).min(1).max(20),
        reportType: z.enum(["summary", "at_risk", "school_comparison", "full"]),
        filters:    z.object({ school: z.string().optional(), grade: z.string().optional() }).optional(),
        isActive:   z.boolean().optional().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        const { reportSchedules } = await import("../drizzle/schema");
        const [result] = await db.insert(reportSchedules).values({
          name:       input.name,
          frequency:  input.frequency,
          dayOfWeek:  input.dayOfWeek ?? null,
          hour:       input.hour,
          recipients: input.recipients,
          reportType: input.reportType,
          filters:    input.filters ?? null,
          isActive:   input.isActive ?? true,
          createdBy:  ctx.user?.id ?? null,
        });
        return { id: (result as any).insertId };
      }),

    updateSchedule: adminProcedure
      .input(z.object({
        id:         z.number(),
        name:       z.string().min(1).max(120).optional(),
        frequency:  z.enum(["daily", "weekly"]).optional(),
        dayOfWeek:  z.number().min(0).max(6).nullable().optional(),
        hour:       z.number().min(0).max(23).optional(),
        recipients: z.array(z.string().email()).min(1).max(20).optional(),
        reportType: z.enum(["summary", "at_risk", "school_comparison", "full"]).optional(),
        filters:    z.object({ school: z.string().optional(), grade: z.string().optional() }).optional(),
        isActive:   z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        const { reportSchedules } = await import("../drizzle/schema");
        const { id, ...rest } = input;
        await db.update(reportSchedules).set(rest as any).where(eq(reportSchedules.id, id));
        return { ok: true };
      }),

    deleteSchedule: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        const { reportSchedules } = await import("../drizzle/schema");
        await db.delete(reportSchedules).where(eq(reportSchedules.id, input.id));
        return { ok: true };
      }),

    sendNow: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        const { reportSchedules } = await import("../drizzle/schema");
        const [sched] = await db.select().from(reportSchedules)
          .where(eq(reportSchedules.id, input.id));
        if (!sched) throw new TRPCError({ code: "NOT_FOUND" });

        const { buildPayload } = await import("./reportScheduler") as any;
        const { buildReportHtml } = await import("./emailService");
        const { sendReportEmail } = await import("./emailService");
        const { kpis, tableRows } = await buildPayload(sched);

        const now     = new Date();
        const subject = `[Manual send] ${sched.name} — ${now.toLocaleDateString("en-GB")}`;
        const textBody = [...Object.entries(kpis).map(([k,v]) => `${k}: ${v}`)].join("\n");
        const htmlBody = buildReportHtml({
          title: sched.name, frequency: "Manual", data: kpis, tableRows,
          generatedAt: now.toISOString(),
        });

        const result = await sendReportEmail({
          to: sched.recipients as string[], subject, htmlBody, textBody,
        });

        if (result.ok) {
          await db.update(reportSchedules).set({ lastSentAt: now })
            .where(eq(reportSchedules.id, input.id));
        }
        return result;
      }),

    getAtRiskStudents: adminProcedure
      .input(z.object({
        daysThreshold:  z.number().min(1).max(365).optional().default(30),
        school:         z.string().optional(),
        grade:          z.string().optional(),
        riskTypes:      z.array(z.enum(["no_payment", "no_assessment", "incomplete_file", "stale"])).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - input.daysThreshold);

        const baseConditions: any[] = [
          // only active statuses — exclude Enrolled and Withdrawn
          sql`${students.status} NOT IN ('Enrolled', 'Withdrawn')`,
        ];
        if (input.school) baseConditions.push(eq(students.school, input.school));
        if (input.grade)  baseConditions.push(eq(students.grade,  input.grade));

        const rows = await db
          .select({
            id:               students.id,
            name:             students.name,
            studentId:        students.studentId,
            school:           students.school,
            grade:            students.grade,
            status:           students.status,
            paymentStatus:    students.paymentStatus,
            assessed:         students.assessed,
            fileComplete:     students.fileComplete,
            seatReserved:     students.seatReserved,
            registrationDate: students.registrationDate,
            fatherMobile:     students.fatherMobile,
            notes:            students.notes,
          })
          .from(students)
          .where(and(...baseConditions));

        const riskTypes = input.riskTypes ?? ["no_payment", "no_assessment", "incomplete_file", "stale"];

        const atRisk = rows
          .map(s => {
            const risks: { type: string; label: string; severity: "high" | "medium" | "low" }[] = [];
            const daysSince = Math.floor(
              (Date.now() - new Date(s.registrationDate).getTime()) / 86_400_000
            );

            if (riskTypes.includes("no_payment") && s.paymentStatus === "Pending")
              risks.push({ type: "no_payment",    label: "No payment",      severity: "high"   });
            if (riskTypes.includes("no_assessment") && !s.assessed)
              risks.push({ type: "no_assessment", label: "Not assessed",    severity: "medium" });
            if (riskTypes.includes("incomplete_file") && !s.fileComplete)
              risks.push({ type: "incomplete_file", label: "File incomplete", severity: "medium" });
            if (riskTypes.includes("stale") && daysSince >= input.daysThreshold)
              risks.push({ type: "stale", label: `Stale ${daysSince}d`,   severity: daysSince > 60 ? "high" : "low" });

            return { ...s, risks, riskScore: risks.reduce((n, r) => n + (r.severity === "high" ? 3 : r.severity === "medium" ? 2 : 1), 0), daysSince };
          })
          .filter(s => s.risks.length > 0)
          .sort((a, b) => b.riskScore - a.riskScore);

        return {
          students: atRisk,
          total:    atRisk.length,
          byRisk: {
            noPayment:      atRisk.filter(s => s.risks.some(r => r.type === "no_payment")).length,
            noAssessment:   atRisk.filter(s => s.risks.some(r => r.type === "no_assessment")).length,
            incompleteFile: atRisk.filter(s => s.risks.some(r => r.type === "incomplete_file")).length,
            stale:          atRisk.filter(s => s.risks.some(r => r.type === "stale")).length,
          },
        };
      }),

    getSchoolComparison: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const SCHOOLS = ["Kids Gate", "AMIS Girls", "AMIS Boys"];

      const results = await Promise.all(
        SCHOOLS.map(async (school) => {
          const base = and(eq(students.school, school));

          const [[total], [reg], [enrolled], [assessed], [passed],
                 [paid], [pending], [fileOk], [seatRes], [saudi]] = await Promise.all([
            db.select({ n: sql<number>`COUNT(*)` }).from(students).where(base),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.registration, true))),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.enrollment, true))),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.assessed, true))),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.passed, true))),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.paymentStatus, "Paid"))),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.paymentStatus, "Pending"))),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.fileComplete, true))),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.seatReserved, true))),
            db.select({ n: sql<number>`COUNT(*)` }).from(students)
              .where(and(base, eq(students.nationality, "Saudi"))),
          ]);

          // Seat capacity from seat_master
          const { seatMaster } = await import("../drizzle/schema");
          const seatRows = await db.select({ cap: sql<number>`SUM(capacity)` })
            .from(seatMaster).where(eq(seatMaster.school, school));
          const capacity = seatRows[0]?.cap ?? 0;

          const t = total?.n ?? 0;
          return {
            school,
            total:            t,
            registered:       reg?.n ?? 0,
            enrolled:         enrolled?.n ?? 0,
            assessed:         assessed?.n ?? 0,
            passed:           passed?.n ?? 0,
            paid:             paid?.n ?? 0,
            pending:          pending?.n ?? 0,
            fileComplete:     fileOk?.n ?? 0,
            seatReserved:     seatRes?.n ?? 0,
            saudi:            saudi?.n ?? 0,
            nonSaudi:         t - (saudi?.n ?? 0),
            capacity,
            occupancy:        capacity > 0 ? Math.round(((seatRes?.n ?? 0) / capacity) * 100) : 0,
            passRate:         assessed?.n ? Math.round(((passed?.n ?? 0) / assessed.n) * 100) : 0,
            paymentRate:      t ? Math.round(((paid?.n ?? 0) / t) * 100) : 0,
            fileCompleteRate: t ? Math.round(((fileOk?.n ?? 0) / t) * 100) : 0,
          };
        })
      );

      return results;
    }),
  }),
});

export type AppRouter = typeof appRouter;
