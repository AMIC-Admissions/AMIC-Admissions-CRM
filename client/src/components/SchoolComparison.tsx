import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportReportToExcel } from "@/lib/exportExcel";
import { exportReportToPDF } from "@/lib/exportPDF";
import {
  Building2, Users, GraduationCap, CreditCard, FileText,
  Armchair, Download, RefreshCw, TrendingUp,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";

/* ── colour per school ── */
const SCHOOL_COLOR: Record<string, { bar: string; badge: string; text: string }> = {
  "Kids Gate":  { bar: "#67e8f9", badge: "bg-cyan-500/15 border-cyan-500/25",   text: "text-cyan-300"   },
  "AMIS Girls": { bar: "#c4b5fd", badge: "bg-violet-500/15 border-violet-500/25", text: "text-violet-300" },
  "AMIS Boys":  { bar: "#6ee7b7", badge: "bg-emerald-500/15 border-emerald-500/25", text: "text-emerald-300" },
};

const TOOLTIP_STYLE = {
  background: "#061f5c",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "white",
  fontSize: 12,
};

/* ── metric row in the big comparison table ── */
function MetricRow({
  label, icon: Icon, data, format = (v: number) => v.toLocaleString(),
  highlight = false,
}: {
  label: string;
  icon: React.ElementType;
  data: { school: string; value: number }[];
  format?: (v: number) => string;
  highlight?: boolean;
}) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <tr className={`border-b border-white/[0.07] ${highlight ? "bg-white/[0.03]" : ""} hover:bg-white/[0.05] transition-colors`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {label}
        </div>
      </td>
      {data.map(({ school, value }) => {
        const c     = SCHOOL_COLOR[school];
        const isTop = value === max && max > 0;
        return (
          <td key={school} className="px-4 py-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className={`text-sm font-black ${isTop ? c?.text ?? "text-white" : "text-white/80"}`}>
                {format(value)}
              </span>
              {isTop && max > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${c?.badge ?? ""} ${c?.text ?? ""}`}>
                  top
                </span>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

/* ── mini bar comparing 3 schools ── */
function MiniBarChart({
  title, dataKey, data, suffix = "",
}: {
  title: string; dataKey: string;
  data: any[]; suffix?: string;
}) {
  return (
    <Card className="technical-panel text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-white/70">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-40 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="school" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }}
              tickFormatter={s => s.replace("AMIS ", "").replace("Kids Gate", "KG")} />
            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }}
              tickFormatter={v => `${v}${suffix}`} />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [`${v}${suffix}`, title]} />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.school} fill={SCHOOL_COLOR[entry.school]?.bar ?? "#9be8ff"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ── main component ── */
export function SchoolComparison() {
  const { data: schools, isLoading, isError, refetch, dataUpdatedAt } =
    trpc.admin.getSchoolComparison.useQuery(undefined, {
      staleTime: 120_000, gcTime: 600_000,
    });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  /* radar chart data — normalise to 100 for each metric */
  const radarData = schools
    ? [
        { metric: "Students",    ...Object.fromEntries(schools.map(s => [s.school, s.total])) },
        { metric: "Enrolled %",  ...Object.fromEntries(schools.map(s => [s.school, s.total ? Math.round((s.enrolled / s.total) * 100) : 0])) },
        { metric: "Pass rate",   ...Object.fromEntries(schools.map(s => [s.school, s.passRate])) },
        { metric: "Paid %",      ...Object.fromEntries(schools.map(s => [s.school, s.paymentRate])) },
        { metric: "Files OK %",  ...Object.fromEntries(schools.map(s => [s.school, s.fileCompleteRate])) },
        { metric: "Occupancy %", ...Object.fromEntries(schools.map(s => [s.school, s.occupancy])) },
      ]
    : [];

  const handleExportExcel = () => {
    if (!schools) return;
    const rows = schools.map(s => ({
      school:           s.school,
      total:            s.total,
      registered:       s.registered,
      enrolled:         s.enrolled,
      assessed:         s.assessed,
      passed:           s.passed,
      paid:             s.paid,
      pending:          s.pending,
      fileComplete:     s.fileComplete,
      seatReserved:     s.seatReserved,
      capacity:         s.capacity,
      occupancy:        `${s.occupancy}%`,
      passRate:         `${s.passRate}%`,
      paymentRate:      `${s.paymentRate}%`,
      fileCompleteRate: `${s.fileCompleteRate}%`,
    }));
    exportReportToExcel({
      title: "School Comparison Report",
      filters: {},
      selectedFields: Object.keys(rows[0]) as any,
      data: rows,
    });
    toast.success("Excel exported");
  };

  const handleExportPDF = () => {
    if (!schools) return;
    exportReportToPDF({
      title: "School Comparison Report",
      filters: {},
      selectedFields: ["school", "total", "enrolled", "passRate", "paymentRate", "fileCompleteRate", "occupancy"] as any,
      data: schools.map(s => ({
        school:           s.school,
        total:            s.total,
        enrolled:         s.enrolled,
        passRate:         `${s.passRate}%`,
        paymentRate:      `${s.paymentRate}%`,
        fileCompleteRate: `${s.fileCompleteRate}%`,
        occupancy:        `${s.occupancy}%`,
      })),
    });
    toast.success("PDF exported");
  };

  /* ── skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="technical-panel rounded-xl p-5 space-y-3 animate-pulse">
              <div className="h-4 w-28 bg-white/10 rounded" />
              <div className="h-10 w-16 bg-white/10 rounded" />
              {[1,2,3,4].map(j => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 w-20 bg-white/10 rounded" />
                  <div className="h-3 w-12 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !schools) {
    return (
      <div className="flex items-center justify-center py-16 text-white/50 text-sm">
        Failed to load school comparison data
      </div>
    );
  }

  /* ── metric rows config ── */
  const metrics = [
    { label: "Total students",       icon: Users,         key: "total"            },
    { label: "Registered",           icon: FileText,      key: "registered"       },
    { label: "Enrolled",             icon: GraduationCap, key: "enrolled"         },
    { label: "Assessed",             icon: TrendingUp,    key: "assessed"         },
    { label: "Passed",               icon: TrendingUp,    key: "passed"           },
    { label: "Pass rate",            icon: TrendingUp,    key: "passRate",        pct: true },
    { label: "Paid",                 icon: CreditCard,    key: "paid"             },
    { label: "Pending payment",      icon: CreditCard,    key: "pending"          },
    { label: "Payment rate",         icon: CreditCard,    key: "paymentRate",     pct: true },
    { label: "Files complete",       icon: FileText,      key: "fileComplete"     },
    { label: "File completion rate", icon: FileText,      key: "fileCompleteRate",pct: true, hl: true },
    { label: "Seats reserved",       icon: Armchair,      key: "seatReserved"     },
    { label: "Total capacity",       icon: Armchair,      key: "capacity"         },
    { label: "Occupancy",            icon: Armchair,      key: "occupancy",       pct: true, hl: true },
    { label: "Saudi students",       icon: Users,         key: "saudi"            },
    { label: "Non-Saudi students",   icon: Users,         key: "nonSaudi"         },
  ];

  return (
    <div className="space-y-6">

      {/* ── top: school summary cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {schools.map(s => {
          const c = SCHOOL_COLOR[s.school];
          return (
            <div key={s.school} className="technical-panel rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${c?.text ?? "text-cyan-300"}`}>
                    {s.school}
                  </span>
                  <p className="text-3xl font-black text-white mt-0.5">{s.total.toLocaleString()}</p>
                  <p className="text-xs text-white/40 mt-0.5">total students</p>
                </div>
                <Building2 className={`h-6 w-6 ${c?.text ?? "text-cyan-300"}`} />
              </div>
              <div className="space-y-2">
                {[
                  ["Enrolled",   s.enrolled,   `${s.total ? Math.round((s.enrolled / s.total) * 100) : 0}%`],
                  ["Pass rate",  `${s.passRate}%`, null],
                  ["Paid",       `${s.paymentRate}%`, null],
                  ["File OK",    `${s.fileCompleteRate}%`, null],
                  ["Occupancy",  `${s.occupancy}%`, `${s.seatReserved}/${s.capacity}`],
                ].map(([label, main, sub]) => (
                  <div key={String(label)} className="flex items-center justify-between text-xs">
                    <span className="text-white/45">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {sub && <span className="text-white/30">{sub}</span>}
                      <span className="font-semibold text-white/80">{main}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* occupancy bar */}
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${s.occupancy}%`, background: c?.bar ?? "#67e8f9" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── mini bar charts ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniBarChart title="Total students"   dataKey="total"       data={schools} />
        <MiniBarChart title="Occupancy"        dataKey="occupancy"   data={schools} suffix="%" />
        <MiniBarChart title="Payment rate"     dataKey="paymentRate" data={schools} suffix="%" />
        <MiniBarChart title="File completion"  dataKey="fileCompleteRate" data={schools} suffix="%" />
      </div>

      {/* ── radar chart ── */}
      <Card className="technical-panel text-white">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase">Overall performance — radar</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }} />
              {schools.map(s => (
                <Radar
                  key={s.school}
                  name={s.school}
                  dataKey={s.school}
                  stroke={SCHOOL_COLOR[s.school]?.bar ?? "#9be8ff"}
                  fill={SCHOOL_COLOR[s.school]?.bar ?? "#9be8ff"}
                  fillOpacity={0.12}
                  strokeWidth={1.5}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, ""]} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── full comparison table ── */}
      <Card className="technical-panel text-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-black uppercase">Detailed comparison</CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[11px] text-white/30 hidden sm:block">
                Updated {lastUpdated}
              </span>
            )}
            <button
              onClick={() => refetch()}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/15 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/15 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-200/15 border border-cyan-200/25 text-cyan-300 hover:bg-cyan-200/25 transition-colors text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-white/40 w-40">
                    Metric
                  </th>
                  {schools.map(s => (
                    <th key={s.school} className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: SCHOOL_COLOR[s.school]?.bar ?? "#9be8ff" }}>
                      {s.school}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <MetricRow
                    key={m.key}
                    label={m.label}
                    icon={m.icon}
                    highlight={m.hl}
                    data={schools.map(s => ({ school: s.school, value: (s as any)[m.key] ?? 0 }))}
                    format={m.pct ? (v: number) => `${v}%` : (v: number) => v.toLocaleString()}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
