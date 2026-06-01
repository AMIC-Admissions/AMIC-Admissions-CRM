import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData, T } from "./types";

/* ── shared table helpers ── */
const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="border border-white/10 px-3 py-3 text-start text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
    {children}
  </th>
);
const TD = ({ children, bold }: { children: React.ReactNode; bold?: boolean }) => (
  <td className={`px-3 py-3 ${bold ? "font-black text-cyan-100" : ""}`}>{children}</td>
);
const TR = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-b border-white/10 hover:bg-white/5">{children}</tr>
);

/* ── School Breakdown ── */
function SchoolBreakdownTable({ t, data }: { t: T; data: DashboardData }) {
  const rows = data.seatUtilization?.bySchool ?? [];
  return (
    <Card className="technical-panel text-white">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase">{t.schoolBreakdown}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-white/10">
              <tr>
                {[t.school, "Assessed", "Passed", t.registered, "Payment Methods", t.seatsReserved]
                  .map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <TR><TD><span className="text-white/40">No data</span></TD></TR>
              ) : rows.map((s: any) => (
                <TR key={s.school}>
                  <TD bold>{s.school}</TD>
                  <TD>{s.assessed ?? 0}</TD>
                  <TD>{s.passed ?? 0}</TD>
                  <TD>{s.registered ?? 0}</TD>
                  <TD>{s.paymentMethods?.join(", ") || "—"}</TD>
                  <TD>{s.seatsReserved ?? 0}</TD>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Seat Summary ── */
function SeatSummaryTable({ t, data }: { t: T; data: DashboardData }) {
  const rows = data.seatUtilization?.byGrade ?? [];
  return (
    <Card className="technical-panel text-white">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase">{t.seatSummary}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead className="bg-white/10">
              <tr>
                {[t.grade, t.capacity, t.seatsReserved, t.available, "Occupancy %"]
                  .map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <TR><TD><span className="text-white/40">No data</span></TD></TR>
              ) : rows.map((seat: any) => {
                const available  = (seat.capacity ?? 0) - (seat.reserved ?? 0);
                const occupancy  = seat.capacity > 0
                  ? Math.round(((seat.reserved ?? 0) / seat.capacity) * 100)
                  : 0;
                const alertColor = available <= 3 ? "text-red-300" : available <= 10 ? "text-amber-300" : "text-cyan-100";
                return (
                  <TR key={seat.grade}>
                    <TD bold>{seat.grade}</TD>
                    <TD>{seat.capacity}</TD>
                    <TD>{seat.reserved}</TD>
                    <td className={`px-3 py-3 font-black ${alertColor}`}>{available}</td>
                    <TD>{occupancy}%</TD>
                  </TR>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Payment Status ── */
function PaymentStatusTable({ t, data }: { t: T; data: DashboardData }) {
  const total = data.totalStudents || 1;
  const rows = [
    { method: "Cash",          count: data.paymentSummary.cash },
    { method: "Bank Transfer", count: data.paymentSummary.bankTransfer },
    { method: "Card",          count: data.paymentSummary.card },
    { method: "Tamara",        count: data.paymentSummary.tamara },
    { method: "JeelPay",       count: data.paymentSummary.jeelPay },
  ];
  const paidPct    = Math.round((data.paymentSummary.paid    / total) * 100);
  const partialPct = Math.round((data.paymentSummary.partial / total) * 100);
  const pendingPct = Math.round((data.paymentSummary.pending / total) * 100);

  return (
    <Card className="technical-panel text-white">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase">{t.paymentStatus}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* paid/pending summary pills */}
        <div className="mb-4 flex gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/25">
            Paid {data.paymentSummary.paid} ({paidPct}%)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 border border-sky-500/25">
            Partial {data.paymentSummary.partial} ({partialPct}%)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/25">
            Pending {data.paymentSummary.pending} ({pendingPct}%)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead className="bg-white/10">
              <tr>
                {["Method", "Count", "% of Total"].map(h => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <TR key={row.method}>
                  <TD bold>{row.method}</TD>
                  <TD>{row.count}</TD>
                  <TD>{Math.round((row.count / total) * 100)}%</TD>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Combined export ── */
interface Props { t: T; data: DashboardData; }

export function DataTables({ t, data }: Props) {
  return (
    <>
      <section><SchoolBreakdownTable t={t} data={data} /></section>
      <section><SeatSummaryTable     t={t} data={data} /></section>
      <section><PaymentStatusTable   t={t} data={data} /></section>
    </>
  );
}
