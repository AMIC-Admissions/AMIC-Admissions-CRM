/**
 * server/emailService.ts
 *
 * Sends report emails via SMTP (nodemailer) when configured,
 * or falls back to the built-in notifyOwner() push notification.
 *
 * Required env vars for SMTP:
 *   SMTP_HOST      e.g. smtp.gmail.com
 *   SMTP_PORT      e.g. 587
 *   SMTP_USER      sender email address
 *   SMTP_PASS      app password / API key
 *   SMTP_FROM      "display name <address>"  (optional, defaults to SMTP_USER)
 *
 * Without SMTP vars the service silently falls back to notifyOwner().
 */

import { notifyOwner } from "./_core/notification";

/* ── SMTP transport (lazy-loaded so missing dep doesn't crash at startup) ── */
async function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  try {
    const nodemailer = await import("nodemailer");
    return nodemailer.default.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user, pass },
    });
  } catch {
    console.warn("[EmailService] nodemailer not installed — falling back to notifyOwner(). Run: pnpm add nodemailer @types/nodemailer");
    return null;
  }
}

export interface ReportEmailPayload {
  to:       string[];
  subject:  string;
  htmlBody: string;
  textBody: string;
}

export async function sendReportEmail(payload: ReportEmailPayload): Promise<{ ok: boolean; method: "smtp" | "notify" | "none" }> {
  /* ── Try SMTP first ── */
  const transport = await createTransport();
  if (transport && payload.to.length > 0) {
    try {
      const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
      await transport.sendMail({
        from,
        to:      payload.to.join(", "),
        subject: payload.subject,
        html:    payload.htmlBody,
        text:    payload.textBody,
      });
      console.log(`[EmailService] Sent via SMTP to ${payload.to.join(", ")}`);
      return { ok: true, method: "smtp" };
    } catch (err) {
      console.error("[EmailService] SMTP send failed:", err);
    }
  }

  /* ── Fallback: notifyOwner() ── */
  try {
    const ok = await notifyOwner({
      title:   payload.subject,
      content: payload.textBody.slice(0, 4000),
    });
    return { ok, method: "notify" };
  } catch {
    return { ok: false, method: "none" };
  }
}

/* ── HTML template ── */
export function buildReportHtml(opts: {
  title: string;
  frequency: string;
  generatedAt: string;
  data: Record<string, number | string>;
  tableRows?: { label: string; value: string | number }[];
  appUrl?: string;
}) {
  const { title, frequency, generatedAt, data, tableRows = [], appUrl = "" } = opts;

  const kpiHtml = Object.entries(data)
    .map(([k, v]) => `
      <td style="text-align:center;padding:12px 20px;border-right:1px solid #e5e7eb">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px">${k}</div>
        <div style="font-size:24px;font-weight:900;color:#111827">${v}</div>
      </td>`)
    .join("");

  const rowHtml = tableRows
    .map((r, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
        <td style="padding:10px 16px;font-size:13px;color:#374151">${r.label}</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#111827;text-align:right">${r.value}</td>
      </tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

        <!-- header -->
        <tr><td style="background:linear-gradient(135deg,#031844 0%,#0a2f6b 100%);padding:28px 32px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:rgba(103,232,249,.8);margin-bottom:6px">${frequency} report</div>
          <div style="font-size:24px;font-weight:900;color:#fff">${title}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">${generatedAt}</div>
        </td></tr>

        <!-- KPI row -->
        <tr><td style="padding:0">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #e5e7eb">
            <tr>${kpiHtml}</tr>
          </table>
        </td></tr>

        ${rowHtml ? `
        <!-- detail table -->
        <tr><td style="padding:24px 32px 0">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:12px">Detail</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
            ${rowHtml}
          </table>
        </td></tr>` : ""}

        <!-- footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #f3f4f6;margin-top:24px">
          <div style="font-size:12px;color:#9ca3af">
            Automated report from School Admissions CRM.
            ${appUrl ? `<a href="${appUrl}" style="color:#0a2f6b;font-weight:600">Open dashboard →</a>` : ""}
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}
