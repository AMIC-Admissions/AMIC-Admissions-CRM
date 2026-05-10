/**
 * server/reportScheduler.ts
 *
 * Starts a cron job that runs every hour, checks report_schedules for
 * any schedule due in the current hour, builds the report, and sends
 * it via emailService.
 *
 * Call startReportScheduler() once from server startup (index.ts).
 *
 * Requires: pnpm add node-cron
 * If node-cron is missing, scheduler is skipped with a warning.
 */

import { getDb } from "./db";
import { reportSchedules, students } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { getDashboardData } from "./db";
import { sendReportEmail, buildReportHtml } from "./emailService";

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/* ── build report payload depending on type ── */
async function buildPayload(schedule: any) {
  const db = await getDb();

  /* always pull dashboard summary */
  const dash = await getDashboardData({
    school: schedule.filters?.school,
    grade:  schedule.filters?.grade,
  });

  const kpis = {
    "Total students": dash.totalStudents,
    "Registered":     dash.registered,
    "Enrolled":       dash.enrolled,
    "Seats reserved": dash.seatsReserved,
    "Seats available":dash.seatsAvailable,
  };

  let tableRows: { label: string; value: string | number }[] = [];

  if (["at_risk", "full"].includes(schedule.reportType) && db) {
    /* top 10 at-risk: pending payment + not assessed + file incomplete */
    const atRisk = await db.select({
      name:          students.name,
      paymentStatus: students.paymentStatus,
      fileComplete:  students.fileComplete,
      assessed:      students.assessed,
    })
    .from(students)
    .where(and(
      sql`${students.status} NOT IN ('Enrolled','Withdrawn')`,
      eq(students.paymentStatus, "Pending"),
    ))
    .limit(10);

    tableRows = atRisk.map(s => ({
      label: s.name,
      value: [
        !s.assessed     ? "Not assessed" : "",
        !s.fileComplete ? "File incomplete" : "",
        "Payment pending",
      ].filter(Boolean).join(" · "),
    }));
  }

  if (schedule.reportType === "school_comparison" && db) {
    const schools = ["Kids Gate", "AMIS Girls", "AMIS Boys"];
    tableRows = await Promise.all(schools.map(async school => {
      const [row] = await db.select({ n: sql<number>`COUNT(*)` })
        .from(students)
        .where(eq(students.school, school));
      return { label: school, value: row?.n ?? 0 };
    }));
  }

  return { kpis, tableRows };
}

/* ── check and fire due schedules ── */
async function checkAndSend() {
  const db = await getDb();
  if (!db) return;

  const now        = new Date();
  const currentDay = now.getUTCDay();
  const currentHr  = now.getUTCHours();

  try {
    const due = await db.select().from(reportSchedules)
      .where(eq(reportSchedules.isActive, true));

    for (const sched of due) {
      const isDailyDue  = sched.frequency === "daily" && sched.hour === currentHr;
      const isWeeklyDue = sched.frequency === "weekly"
        && sched.dayOfWeek === currentDay
        && sched.hour === currentHr;

      if (!isDailyDue && !isWeeklyDue) continue;

      /* avoid double-send: skip if already sent in the last 50 min */
      if (sched.lastSentAt) {
        const minsAgo = (Date.now() - new Date(sched.lastSentAt).getTime()) / 60_000;
        if (minsAgo < 50) continue;
      }

      const recipients = (sched.recipients as string[]).filter(Boolean);
      if (!recipients.length) continue;

      console.log(`[Scheduler] Sending "${sched.name}" (${sched.frequency}) to ${recipients.join(", ")}`);

      try {
        const { kpis, tableRows } = await buildPayload(sched);
        const freq    = sched.frequency === "weekly"
          ? `Weekly (${DAY_NAMES[sched.dayOfWeek ?? 0]})`
          : "Daily";
        const subject = `${freq} report — ${sched.name} · ${now.toLocaleDateString("en-GB")}`;
        const textBody = [
          subject,
          "",
          ...Object.entries(kpis).map(([k, v]) => `${k}: ${v}`),
          "",
          ...(tableRows.map(r => `${r.label}: ${r.value}`)),
        ].join("\n");

        const htmlBody = buildReportHtml({
          title:       sched.name,
          frequency:   freq,
          generatedAt: now.toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC",
          data:        kpis,
          tableRows,
          appUrl:      process.env.APP_URL ?? "",
        });

        const result = await sendReportEmail({ to: recipients, subject, htmlBody, textBody });

        if (result.ok) {
          await db.update(reportSchedules)
            .set({ lastSentAt: now })
            .where(eq(reportSchedules.id, sched.id));
        }
      } catch (err) {
        console.error(`[Scheduler] Error sending schedule ${sched.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[Scheduler] Error querying schedules:", err);
  }
}

/* ── public API ── */
export async function startReportScheduler() {
  try {
    const cron = await import("node-cron");
    /* run at the top of every hour */
    cron.default.schedule("0 * * * *", checkAndSend);
    console.log("[Scheduler] Report scheduler started — checks every hour.");
  } catch {
    console.warn("[Scheduler] node-cron not installed. Run: pnpm add node-cron @types/node-cron");
    console.warn("[Scheduler] Reports can still be sent manually via the UI.");
  }
}

/* allow manual trigger for testing */
export { checkAndSend as runSchedulerNow };
