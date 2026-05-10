import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportReportToExcel } from "@/lib/exportExcel";
import { exportReportToPDF } from "@/lib/exportPDF";
import {
  AlertTriangle, AlertCircle, Info,
  Phone, Download, RefreshCw, Filter,
  CreditCard, ClipboardX, FileWarning, Clock,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/* ── types ── */
type Severity = "high" | "medium" | "low";
type RiskType = "no_payment" | "no_assessment" | "incomplete_file" | "stale";

interface Risk { type: string; label: string; severity: Severity; }
interface AtRiskStudent {
  id: number; name: string; studentId: string;
  school: string; grade: string; status: string;
  paymentStatus: string; assessed: boolean;
  fileComplete: boolean; seatReserved: boolean;
  registrationDate: string; fatherMobile?: string;
  notes?: string; risks: Risk[];
  riskScore: number; daysSince: number;
}

/* ── constants ── */
const RISK_META: Record<string, {
  label: string; icon: React.ElementType;
  bg: string; border: string; text: string;
}> = {
  no_payment:      { label: "No Payment",      icon: CreditCard,   bg: "bg-red-500/15",    border: "border-red-500/30",    text: "text-red-300"    },
  no_assessment:   { label: "Not Assessed",    icon: ClipboardX,   bg: "bg-amber-500/15",  border: "border-amber-500/30",  text: "text-amber-300"  },
  incomplete_file: { label: "File Incomplete", icon: FileWarning,  bg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-300" },
  stale:           { label: "Stale Record",    icon: Clock,        bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-300" },
};

const SEV_STYLE: Record<Severity, { dot: string; row: string }> = {
  high:   { dot: "bg-red-400",    row: "" },
  medium: { dot: "bg-amber-400",  row: "" },
  low:    { dot: "bg-blue-400",   row: "" },
};

const ALL_RISK_TYPES: RiskType[] = ["no_payment", "no_assessment", "incomplete_file", "stale"];

/* ── helpers ── */
function RiskBadge({ risk }: { risk: Risk }) {
  const m = RISK_META[risk.type];
  if (!m) return null;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${m.bg} ${m.border} ${m.text}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {risk.label}
    </span>
  );
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 6 ? "bg-red-400" : score >= 3 ? "bg-amber-400" : "bg-blue-400";
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white ${color}`}>
      {score}
    </span>
  );
}

/* ── summary card ── */
function SummaryCard({
  label, value, icon: Icon, bg, border, text,
}: {
  label: string; value: number;
  icon: React.ElementType; bg: string; border: string; text: string;
}) {
  return (
    <div className={`rounded-xl p-4 border ${bg} ${border}`}>
      <div className="flex items-start justify-between mb-2">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${text}`}>{label}</p>
        <Icon className={`h-4 w-4 ${text}`} />
      </div>
      <p className="text-3xl font-black text-white">{value.toLocaleString()}</p>
    </div>
  );
}

/* ── main component ── */
export function AtRiskReport() {
  const [, setLocation] = useLocation();

  /* filters */
  const [days, setDays]           = useState(30);
  const [school, setSchool]       = useState("");
  const [grade, setGrade]         = useState("");
  const [riskTypes, setRiskTypes] = useState<RiskType[]>(ALL_RISK_TYPES);
  const [expanded, setExpanded]   = useState<Set<number>>(new Set());

  /* query */
  const { data, isLoading, isError, refetch, dataUpdatedAt } =
    trpc.admin.getAtRiskStudents.useQuery(
      { daysThreshold: days, school: school || undefined, grade: grade || undefined, riskTypes },
      { staleTime: 60_000, gcTime: 300_000 }
    );
  const filterOptions = trpc.admissions.getFilterOptions.useQuery(undefined, {
    staleTime: 600_000, gcTime: 1_800_000, refetchOnWindowFocus: false,
  });

  const students = data?.students ?? [];
  const byRisk   = data?.byRisk ?? { noPayment: 0, noAssessment: 0, incompleteFile: 0, stale: 0 };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  const toggleRiskType = (t: RiskType) =>
    setRiskTypes(prev =>
      prev.includes(t) ? prev.filter(r => r !== t) : [...prev, t]
    );

  const toggleExpanded = (id: number) =>
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handleExportExcel = () => {
    if (!students.length) return toast.error("No data to export");
    exportReportToExcel({
      title: "At-Risk Students Report",
      filters: { daysThreshold: days, school, grade },
      selectedFields: ["studentName", "studentId", "school", "grade", "status", "paymentStatus", "fileComplete", "assessed"] as any,
      data: students.map(s => ({
        name:          s.name,
        studentId:     s.studentId,
        school:        s.school,
        grade:         s.grade,
        status:        s.status,
        paymentStatus: s.paymentStatus,
        fileComplete:  s.fileComplete ? "Yes" : "No",
        assessed:      s.assessed     ? "Yes" : "No",
        risks:         s.risks.map(r => r.label).join(", "),
        riskScore:     s.riskScore,
        daysSince:     s.daysSince,
        fatherMobile:  s.fatherMobile ?? "",
      })),
    });
    toast.success("Excel exported");
  };

  const handleExportPDF = () => {
    if (!students.length) return toast.error("No data to export");
    exportReportToPDF({
      title: "At-Risk Students Report",
      filters: { daysThreshold: days },
      selectedFields: ["studentName", "studentId", "school", "grade", "status", "paymentStatus"] as any,
      data: students.slice(0, 100).map(s => ({
        name:      s.name,
        studentId: s.studentId,
        school:    s.school,
        grade:     s.grade,
        status:    s.status,
        risks:     s.risks.map(r => r.label).join(", "),
      })),
    });
    toast.success("PDF exported");
  };

  return (
    <div className="space-y-5">

      {/* ── filter bar ── */}
      <div className="technical-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-widest text-white/50">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* stale threshold */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Stale after (days)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={7} max={180} step={7} value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <span className="text-sm font-bold text-white w-8 text-right">{days}</span>
            </div>
          </div>

          {/* school */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">School</label>
            <select
              value={school}
              onChange={e => setSchool(e.target.value)}
              className="w-full h-9 rounded-lg border border-white/15 bg-white/5 px-2 text-sm text-white"
            >
              <option value="">All schools</option>
              {(filterOptions.data?.schools ?? []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* grade */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Grade</label>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="w-full h-9 rounded-lg border border-white/15 bg-white/5 px-2 text-sm text-white"
            >
              <option value="">All grades</option>
              {(filterOptions.data?.grades ?? []).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* risk type toggles */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Risk types</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_RISK_TYPES.map(rt => {
                const m   = RISK_META[rt];
                const on  = riskTypes.includes(rt);
                const Icon = m.icon;
                return (
                  <button
                    key={rt}
                    onClick={() => toggleRiskType(rt)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all ${
                      on ? `${m.bg} ${m.border} ${m.text}` : "border-white/10 text-white/25 bg-transparent"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── summary cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="No Payment"      value={byRisk.noPayment}      icon={CreditCard}  bg="bg-red-500/10"    border="border-red-500/20"    text="text-red-300"    />
        <SummaryCard label="Not Assessed"    value={byRisk.noAssessment}   icon={ClipboardX}  bg="bg-amber-500/10"  border="border-amber-500/20"  text="text-amber-300"  />
        <SummaryCard label="File Incomplete" value={byRisk.incompleteFile} icon={FileWarning} bg="bg-orange-500/10" border="border-orange-500/20" text="text-orange-300" />
        <SummaryCard label={`Stale >${days}d`} value={byRisk.stale}        icon={Clock}       bg="bg-purple-500/10" border="border-purple-500/20" text="text-purple-300" />
      </div>

      {/* ── main table ── */}
      <Card className="technical-panel text-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              At-Risk Students
            </CardTitle>
            {data && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
                {data.total.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[11px] text-white/25 hidden sm:block">Updated {lastUpdated}</span>
            )}
            <button
              onClick={() => refetch()}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/15 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/15 text-white/50 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
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
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 border-b border-white/[0.06]"
                  style={{ opacity: 1 - i * 0.12 }}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="flex-1 h-3 bg-white/10 animate-pulse rounded" />
                  ))}
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="p-8 text-center text-red-300 text-sm">Failed to load at-risk students.</p>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-12 w-12 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-sm text-white/50">No at-risk students match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    {["Score", "Student", "School / Grade", "Status", "Risk flags", "Days", "Contact"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/35 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s: AtRiskStudent) => {
                    const isExpanded = expanded.has(s.id);
                    const maxSev     = s.risks.some(r => r.severity === "high") ? "high"
                                     : s.risks.some(r => r.severity === "medium") ? "medium" : "low";
                    return (
                      <>
                        <tr
                          key={s.id}
                          onClick={() => toggleExpanded(s.id)}
                          className={`border-b border-white/[0.06] cursor-pointer transition-colors hover:bg-white/[0.04] ${
                            maxSev === "high" ? "border-l-2 border-l-red-500/50" : maxSev === "medium" ? "border-l-2 border-l-amber-500/40" : ""
                          } ${isExpanded ? "bg-white/[0.04]" : ""}`}
                        >
                          {/* score */}
                          <td className="px-4 py-3">
                            <ScoreDot score={s.riskScore} />
                          </td>
                          {/* student */}
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{s.name}</p>
                            <p className="text-[11px] text-white/40 font-mono">{s.studentId}</p>
                          </td>
                          {/* school/grade */}
                          <td className="px-4 py-3">
                            <p className="text-white/70 truncate max-w-[130px]">{s.school}</p>
                            <p className="text-[11px] text-white/40">{s.grade}</p>
                          </td>
                          {/* status */}
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                              {s.status}
                            </span>
                          </td>
                          {/* risk flags */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {s.risks.map((r, ri) => <RiskBadge key={ri} risk={r} />)}
                            </div>
                          </td>
                          {/* days since registration */}
                          <td className="px-4 py-3 tabular-nums">
                            <span className={`text-xs font-bold ${s.daysSince > 60 ? "text-red-300" : s.daysSince > 30 ? "text-amber-300" : "text-white/50"}`}>
                              {s.daysSince}d
                            </span>
                          </td>
                          {/* contact */}
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            {s.fatherMobile ? (
                              <a
                                href={`tel:${s.fatherMobile}`}
                                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 transition-colors text-xs"
                              >
                                <Phone className="h-3 w-3" />
                                {s.fatherMobile}
                              </a>
                            ) : (
                              <span className="text-white/20 text-xs">—</span>
                            )}
                          </td>
                        </tr>

                        {/* expanded row */}
                        {isExpanded && (
                          <tr key={`${s.id}-exp`} className="border-b border-white/[0.06] bg-white/[0.02]">
                            <td colSpan={7} className="px-4 pb-4 pt-2">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {/* risk breakdown */}
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Risk detail</p>
                                  <div className="space-y-1.5">
                                    {s.risks.map((r, ri) => {
                                      const m    = RISK_META[r.type];
                                      const Icon = m?.icon ?? Info;
                                      return (
                                        <div key={ri} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${m?.bg ?? ""} ${m?.border ?? ""}`}>
                                          <Icon className={`h-3.5 w-3.5 shrink-0 ${m?.text ?? ""}`} />
                                          <span className={`text-xs font-semibold ${m?.text ?? "text-white/60"}`}>{r.label}</span>
                                          <span className="ml-auto text-[10px] text-white/30 capitalize">{r.severity}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* quick facts */}
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Quick facts</p>
                                  <dl className="space-y-1.5 text-xs">
                                    {[
                                      ["Registered",   new Date(s.registrationDate).toLocaleDateString("en-GB")],
                                      ["Payment",      s.paymentStatus],
                                      ["Assessed",     s.assessed ? "✓ Yes" : "✗ No"],
                                      ["File",         s.fileComplete ? "✓ Complete" : "✗ Incomplete"],
                                      ["Seat reserved",s.seatReserved ? "✓ Yes" : "✗ No"],
                                    ].map(([k, v]) => (
                                      <div key={String(k)} className="flex justify-between gap-4">
                                        <dt className="text-white/35">{k}</dt>
                                        <dd className={`font-medium ${String(v).startsWith("✗") ? "text-red-300" : String(v).startsWith("✓") ? "text-green-300" : "text-white/70"}`}>
                                          {v}
                                        </dd>
                                      </div>
                                    ))}
                                  </dl>
                                </div>
                                {/* actions */}
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Actions</p>
                                  <div className="space-y-2">
                                    <button
                                      onClick={() => setLocation(`/students?highlight=${s.id}`)}
                                      className="w-full text-left text-xs font-semibold px-3 py-2 rounded-lg bg-cyan-200/10 border border-cyan-200/20 text-cyan-300 hover:bg-cyan-200/20 transition-colors"
                                    >
                                      → Open student record
                                    </button>
                                    {s.notes && (
                                      <p className="text-[11px] text-white/35 italic px-1">{s.notes}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
