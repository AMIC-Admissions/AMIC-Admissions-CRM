import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  History, Search, Plus, Edit2, Trash2, ChevronRight,
  ChevronDown, RefreshCw, Download, Filter, User,
  X, AlertCircle,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/* ── types ── */
type ActionType = "create" | "update" | "delete";

/* ── action config ── */
const ACTION_CFG: Record<ActionType, {
  label: string; icon: React.ElementType;
  bg: string; border: string; text: string; dot: string;
}> = {
  create: { label: "Created", icon: Plus,    bg: "bg-emerald-500/15", border: "border-emerald-500/25", text: "text-emerald-300", dot: "bg-emerald-400" },
  update: { label: "Updated", icon: Edit2,   bg: "bg-cyan-500/15",    border: "border-cyan-500/25",    text: "text-cyan-300",    dot: "bg-cyan-400"    },
  delete: { label: "Deleted", icon: Trash2,  bg: "bg-red-500/15",     border: "border-red-500/25",     text: "text-red-300",     dot: "bg-red-400"     },
};

/* ── field label map ── */
const FIELD_LABEL: Record<string, string> = {
  name: "Name", gender: "Gender", nationality: "Nationality",
  school: "School", grade: "Grade", section: "Section",
  status: "Status", paymentStatus: "Payment status",
  paymentMethod: "Payment method", fileComplete: "File complete",
  seatReserved: "Seat reserved", assessed: "Assessed",
  passed: "Passed", firstInstallment: "1st instalment",
  secondInstallment: "2nd instalment", fullPayment: "Full payment",
  promissoryNote: "Promissory note", tamara: "Tamara",
  jeelPay: "JeelPay", docsSigned: "Docs signed",
  requirementsSubmitted: "Req. submitted", fatherMobile: "Father mobile",
  motherMobile: "Mother mobile", studentType: "Student type", notes: "Notes",
};

function fieldLabel(k: string) { return FIELD_LABEL[k] ?? k; }
function fmtVal(v: unknown) {
  if (v === null || v === undefined) return <span className="text-white/25 italic">—</span>;
  if (typeof v === "boolean") return v
    ? <span className="text-emerald-300 font-semibold">Yes</span>
    : <span className="text-white/40">No</span>;
  return <span className="text-white/80">{String(v)}</span>;
}

/* ── change diff row ── */
function DiffRow({ field, before, after }: { field: string; before: unknown; after: unknown }) {
  return (
    <div className="grid grid-cols-[140px_1fr_1fr] gap-2 items-start text-xs border-b border-white/[0.06] py-1.5 last:border-0">
      <span className="text-white/35 font-medium">{fieldLabel(field)}</span>
      <span className="line-through text-white/30">{fmtVal(before)}</span>
      <span>{fmtVal(after)}</span>
    </div>
  );
}

/* ── log entry row ── */
function LogEntry({ entry, onStudentClick }: {
  entry: any;
  onStudentClick: (id: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ACTION_CFG[entry.action as ActionType];
  const Icon = cfg.icon;

  const hasChanges = entry.changes && Object.keys(entry.changes).length > 0;
  const hasSnapshot = !!entry.snapshot;
  const canExpand = hasChanges || hasSnapshot;

  const ts = new Date(entry.createdAt);
  const timeStr = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dateStr = ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <tr
        onClick={() => canExpand && setExpanded(e => !e)}
        className={`border-b border-white/[0.06] transition-colors group ${
          canExpand ? "cursor-pointer hover:bg-white/[0.03]" : ""
        } ${expanded ? "bg-white/[0.04]" : ""}`}
      >
        {/* expand chevron */}
        <td className="w-8 px-2 text-white/20">
          {canExpand && (
            expanded
              ? <ChevronDown  className="h-4 w-4 text-white/40" />
              : <ChevronRight className="h-4 w-4" />
          )}
        </td>

        {/* action badge */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
        </td>

        {/* student */}
        <td className="px-4 py-3">
          <button
            onClick={e => { e.stopPropagation(); onStudentClick(entry.studentId); }}
            className="text-left hover:text-cyan-300 transition-colors"
          >
            <p className="text-sm font-medium text-white leading-tight">
              {entry.studentName ?? <span className="text-white/30 italic">Deleted student</span>}
            </p>
            {entry.studentSid && (
              <p className="text-[11px] text-white/35 font-mono mt-0.5">{entry.studentSid}</p>
            )}
          </button>
        </td>

        {/* changes summary */}
        <td className="px-4 py-3">
          {entry.action === "update" && hasChanges ? (
            <div className="flex flex-wrap gap-1">
              {Object.keys(entry.changes).slice(0, 4).map(k => (
                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
                  {fieldLabel(k)}
                </span>
              ))}
              {Object.keys(entry.changes).length > 4 && (
                <span className="text-[10px] text-white/25">+{Object.keys(entry.changes).length - 4} more</span>
              )}
            </div>
          ) : entry.action === "create" ? (
            <span className="text-[11px] text-white/30">New record</span>
          ) : (
            <span className="text-[11px] text-red-300/60">Record removed</span>
          )}
        </td>

        {/* performed by */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-white/25 shrink-0" />
            <span className="text-xs text-white/50 truncate max-w-[120px]">
              {entry.performedName ?? "Unknown"}
            </span>
          </div>
        </td>

        {/* timestamp */}
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <p className="text-xs text-white/50">{timeStr}</p>
          <p className="text-[11px] text-white/25">{dateStr}</p>
        </td>
      </tr>

      {/* expanded diff */}
      {expanded && canExpand && (
        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
          <td colSpan={6} className="px-6 pb-4 pt-2">
            {hasChanges && (
              <>
                <div className="grid grid-cols-[140px_1fr_1fr] gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Field</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">Before</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">After</span>
                </div>
                {Object.entries(entry.changes as Record<string, [unknown, unknown]>).map(([k, [b, a]]) => (
                  <DiffRow key={k} field={k} before={b} after={a} />
                ))}
              </>
            )}
            {hasSnapshot && (
              <details className="mt-3">
                <summary className="text-[10px] font-bold uppercase tracking-widest text-white/25 cursor-pointer select-none">
                  View deleted record snapshot
                </summary>
                <pre className="mt-2 text-[10px] text-white/40 font-mono overflow-x-auto rounded bg-white/5 p-3 max-h-48">
                  {JSON.stringify(entry.snapshot, null, 2)}
                </pre>
              </details>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ── skeleton ── */
function Skeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-white/[0.05]" style={{ opacity: 1 - i * 0.1 }}>
          <div className="w-8" />
          {[60, 100, 140, 180, 100, 70].map((w, j) => (
            <div key={j} className="h-3 bg-white/10 animate-pulse rounded shrink-0" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── main page ── */
export default function AuditLog() {
  const { user }       = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";

  /* filters */
  const [search, setSearch]   = useState("");
  const [dSearch, setDSearch] = useState("");
  const [action, setAction]   = useState<ActionType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]   = useState("");
  const [page, setPage]       = useState(0);
  const PAGE = 50;

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setDSearch(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch, dataUpdatedAt } =
    trpc.admin.listAuditLog.useQuery(
      {
        action:   (action || undefined) as ActionType | undefined,
        search:   dSearch || undefined,
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
        limit:    PAGE,
        offset:   page * PAGE,
      },
      { enabled: isAdmin, staleTime: 10_000 }
    );

  const entries   = data?.data ?? [];
  const total     = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE));

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  const handleStudentClick = useCallback((studentId: number | null) => {
    if (studentId) setLocation(`/students?highlight=${studentId}`);
  }, [setLocation]);

  const handleExport = () => {
    if (!entries.length) return toast.error("No data to export");
    const headers = ["Action", "Student name", "Student ID", "Changed fields", "Performed by", "Date/time"];
    const rows = entries.map(e => [
      e.action,
      e.studentName ?? "",
      e.studentSid ?? "",
      e.changes ? Object.keys(e.changes as object).join(", ") : "",
      e.performedName ?? "",
      new Date(e.createdAt).toLocaleString("en-GB"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `audit_log_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click(); URL.revokeObjectURL(a.href);
    toast.success("CSV exported");
  };

  if (!isAdmin) {
    return (
      <div className="blueprint-bg min-h-screen p-8">
        <Card className="technical-panel mx-auto mt-16 max-w-md text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" /> Access denied
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-white/60">Admin access required.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="blueprint-bg min-h-screen">
      <div className="container space-y-5 py-6 sm:py-8">

        {/* ── header ── */}
        <section className="technical-panel dimension-frame rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl flex items-center gap-3">
                <History className="h-8 w-8 text-cyan-300" />
                Audit Log
              </h1>
              <p className="mt-1.5 text-sm text-white/50">
                Every create, update, and delete on student records — immutable, timestamped.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => refetch()}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/15 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <Button onClick={handleExport}
                className="border border-white/20 bg-white/10 text-white hover:bg-white/20 gap-1.5">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        </section>

        {/* ── filters ── */}
        <div className="technical-panel rounded-xl p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, ID or admin…"
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-white/5 border border-white/15 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* action filter */}
            <div className="flex rounded-lg overflow-hidden border border-white/15">
              {(["", "create", "update", "delete"] as const).map(a => (
                <button
                  key={a}
                  onClick={() => { setAction(a); setPage(0); }}
                  className={`flex-1 py-1.5 text-[11px] font-semibold transition-colors capitalize ${
                    action === a
                      ? a === "create" ? "bg-emerald-500/30 text-emerald-300"
                        : a === "update" ? "bg-cyan-500/30 text-cyan-300"
                        : a === "delete" ? "bg-red-500/30 text-red-300"
                        : "bg-white/15 text-white"
                      : "bg-transparent text-white/35 hover:text-white/60"
                  }`}
                >
                  {a || "All"}
                </button>
              ))}
            </div>

            {/* date from */}
            <input
              type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(0); }}
              className="h-9 rounded-lg bg-white/5 border border-white/15 px-3 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
            />

            {/* date to */}
            <input
              type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(0); }}
              className="h-9 rounded-lg bg-white/5 border border-white/15 px-3 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
            />
          </div>
        </div>

        {/* ── table ── */}
        <Card className="technical-panel text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-black uppercase">Activity</CardTitle>
              {!isLoading && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                  {total.toLocaleString()} entries
                </span>
              )}
            </div>
            {lastUpdated && (
              <span className="text-[11px] text-white/25 hidden sm:block">Updated {lastUpdated}</span>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <Skeleton />
            ) : isError ? (
              <p className="p-8 text-center text-red-300 text-sm">Failed to load audit log.</p>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <History className="h-10 w-10 text-white/10" />
                <p className="text-sm text-white/30">No activity matches the current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="w-8 px-2" />
                      {["Action", "Student", "Changes", "Performed by", "Timestamp"].map(h => (
                        <th key={h}
                          className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-white/30 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => (
                      <LogEntry
                        key={entry.id}
                        entry={entry}
                        onStudentClick={handleStudentClick}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                <p className="text-xs text-white/30 tabular-nums">
                  {(page * PAGE + 1).toLocaleString()}–{Math.min((page + 1) * PAGE, total).toLocaleString()} of {total.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-white/15 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-25 transition-colors">
                    ‹
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    if (Math.abs(i - page) > 2 && i !== 0 && i !== totalPages - 1) return null;
                    return (
                      <button key={i} onClick={() => setPage(i)}
                        className={`h-7 min-w-[28px] px-1.5 rounded-md text-xs font-medium transition-colors ${
                          i === page
                            ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
                            : "text-white/40 hover:text-white hover:bg-white/10 border border-transparent"
                        }`}>
                        {i + 1}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-white/15 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-25 transition-colors">
                    ›
                  </button>
                </div>
                <p className="text-xs text-white/20 hidden sm:block">{PAGE} per page</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
