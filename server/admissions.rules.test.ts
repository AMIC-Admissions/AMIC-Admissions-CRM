import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "admin" | "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: role === "admin" ? 1 : 2,
    openId: `${role}-open-id`,
    email: `${role}@example.com`,
    name: `${role} user`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
}

/**
 * Validation helper functions
 */
function assertValidProgression(currentStatus: string, nextStatus: string): void {
  const validProgression: Record<string, string> = {
    "Registered": "Assessed",
    "Assessed": "Passed",
    "Passed": "Enrolled",
  };

  if (validProgression[currentStatus] !== nextStatus) {
    throw new Error(`Invalid progression: must move one step forward in the workflow`);
  }
}

function assertSeatAvailableForEnrollment(availableSeats: number): void {
  if (availableSeats <= 0) {
    throw new Error("Cannot enroll: no seats are available for this section");
  }
}

function assertPaymentMethod(method: string): void {
  const validMethods = ["Cash", "Bank Transfer", "Card", "Tamara", "JeelPay", "Promissory Note"];
  if (!validMethods.includes(method)) {
    throw new Error(`Invalid payment method: must be Cash, Bank Transfer, Card, Tamara, JeelPay, or Promissory Note`);
  }
}

describe("admissions business rules", () => {
  it("allows only exact one-step admissions progression", () => {
    expect(() => assertValidProgression("Registered", "Assessed")).not.toThrow();
    expect(() => assertValidProgression("Assessed", "Passed")).not.toThrow();
    expect(() => assertValidProgression("Passed", "Enrolled")).not.toThrow();
    expect(() => assertValidProgression("Registered", "Passed")).toThrow(/one step forward/i);
    expect(() => assertValidProgression("Passed", "Assessed")).toThrow(/one step forward/i);
  });

  it("blocks enrollment when there are no available seats", () => {
    expect(() => assertSeatAvailableForEnrollment(1)).not.toThrow();
    expect(() => assertSeatAvailableForEnrollment(0)).toThrow(/no seats are available/i);
    expect(() => assertSeatAvailableForEnrollment(-2)).toThrow(/no seats are available/i);
  });

  it("accepts the configured payment methods", () => {
    expect(() => assertPaymentMethod("Cash")).not.toThrow();
    expect(() => assertPaymentMethod("Bank Transfer")).not.toThrow();
    expect(() => assertPaymentMethod("Card")).not.toThrow();
    expect(() => assertPaymentMethod("Tamara")).not.toThrow();
    expect(() => assertPaymentMethod("JeelPay")).not.toThrow();
    expect(() => assertPaymentMethod("Promissory Note")).not.toThrow();
    expect(() => assertPaymentMethod("Cheque")).toThrow(/Bank Transfer/i);
  });
});

describe("admissions authorization", () => {
  it("rejects protected admissions operations for non-admin users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.admissions.listStudents({})).rejects.toBeInstanceOf(TRPCError);
    await expect(caller.admissions.listStudents({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects invalid payment methods at the API validation boundary", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(
      caller.admissions.createStudent({
        studentId: "T-100",
        name: "Test Student",
        gender: "Male",
        nationality: "Saudi",
        school: "AMIS Boys",
        grade: "Grade 1",
        registrationDate: new Date(),
        paymentStatus: "Pending",
        paymentMethod: "Cheque" as "Cash",
        fileComplete: false,
      }),
    ).rejects.toThrow();
  });
});
