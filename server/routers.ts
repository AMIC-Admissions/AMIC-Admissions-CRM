import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access is required for admissions operations." });
  }
  return next({ ctx });
});

const statusSchema = z.enum(["Registered", "Assessed", "Passed", "Enrolled"]);
const genderSchema = z.enum(["Male", "Female"]);
const paymentStatusSchema = z.enum(["Paid", "Pending"]);
const paymentMethodSchema = z.enum(["Cash", "Tamara", "JeelPay"]);

const filterSchema = z.object({
  school: z.string().optional(),
  grade: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const studentBaseSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  gender: genderSchema,
  nationality: z.string().min(1),
  school: z.string().min(1),
  grade: z.string().min(1),
  registrationDate: z.coerce.date(),
  paymentStatus: paymentStatusSchema,
  paymentMethod: paymentMethodSchema,
  fileComplete: z.boolean(),
});

function toTrpcError(error: unknown) {
  if (error instanceof TRPCError) return error;
  const message = error instanceof Error ? error.message : "Admissions operation failed.";
  return new TRPCError({ code: "BAD_REQUEST", message });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  admissions: router({
    dashboard: adminProcedure.input(filterSchema.default({})).query(async ({ input }) => db.getDashboard(input)),
    filters: adminProcedure.query(async () => db.getFilterOptions()),
    listStudents: adminProcedure.input(filterSchema.default({})).query(async ({ input }) => db.listStudents(input)),
    createStudent: adminProcedure.input(studentBaseSchema).mutation(async ({ input, ctx }) => {
      try {
        return await db.createStudent({ ...input, status: "Registered", createdBy: ctx.user.id });
      } catch (error) {
        throw toTrpcError(error);
      }
    }),
    updateStudent: adminProcedure
      .input(studentBaseSchema.partial().extend({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...values } = input;
          return await db.updateStudent(id, values);
        } catch (error) {
          throw toTrpcError(error);
        }
      }),
    deleteStudent: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      try {
        return await db.deleteStudent(input.id);
      } catch (error) {
        throw toTrpcError(error);
      }
    }),
    progressStudent: adminProcedure
      .input(z.object({ id: z.number().int().positive(), nextStatus: statusSchema }))
      .mutation(async ({ input }) => {
        try {
          return await db.updateStudentStatus(input.id, input.nextStatus);
        } catch (error) {
          throw toTrpcError(error);
        }
      }),
    listSeats: adminProcedure.query(async () => db.listSeatCapacitiesWithUsage()),
    upsertSeat: adminProcedure
      .input(z.object({ school: z.string().min(1), grade: z.string().min(1), capacity: z.number().int().min(0) }))
      .mutation(async ({ input }) => {
        try {
          return await db.upsertSeatCapacity(input);
        } catch (error) {
          throw toTrpcError(error);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
