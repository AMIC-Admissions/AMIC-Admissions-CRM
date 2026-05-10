import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Bell, Armchair, FileWarning, CheckCheck,
  ChevronRight, RefreshCw, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

/* ── types inferred from backend ── */
type LowSeatAlert = {
  school: string; grade: string; section: string;
  available: number; capacity: number;
};
type IncompleteFile = {
  id: number; name: string; studentId: string;
  school: string; grade: string;
};

/* ── urgency colour for seats ── */
function seatColor(available: number) {
  if (available === 0) return { dot: "bg-red-500",   text: "text-red-400",   badge: "bg-red-500/15 text-red-300 border-red-500/25" };
  if (available <= 1)  return { dot: "bg-red-400",   text: "text-red-400",   badge: "bg-red-500/15 text-red-300 border-red-500/25" };
  return               { dot: "bg-amber-400", text: "text-amber-400", badge: "bg-amber-500/15 text-amber-300 border-amber-500/25" };
}

/* ── animated badge ── */
function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50" />
      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-bold text-white leading-none">
        {count > 99 ? "99+" : count}
      </span>
    </span>
  );
}

/* ── main component ── */
export function NotificationBell() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState<"seats" | "files">("seats");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);

  const isAdmin = user?.role === "admin";

  const { data, isLoading, refetch, dataUpdatedAt } = trpc.admin.getAlerts.useQuery(
    undefined,
    { enabled: isAdmin, refetchInterval: 60_000, staleTime: 30_000 }
  );

  const lowSeats  = (data?.lowSeatAlerts  ?? []).filter((s: LowSeatAlert) => !dismissed.has(`seat:${s.school}|${s.grade}|${s.section}`));
  const incFiles  = (data?.incompleteFiles ?? []).filter((f: IncompleteFile) => !dismissed.has(`file:${f.id}`));
  const total     = lowSeats.length + incFiles.length;

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* switch to files tab if seats tab is empty */
  useEffect(() => {
    if (tab === "seats" && lowSeats.length === 0 && incFiles.length > 0) setTab("files");
    if (tab === "files" && incFiles.length === 0 && lowSeats.length > 0) setTab("seats");
  }, [lowSeats.length, incFiles.length]);

  const dismiss = (key: string) =>
    setDismissed(prev => new Set(Array.from(prev).concat(key)));

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  if (!isAdmin) return null;

  return (
    <div className="relative">
      {/* ── Bell button ── */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className={`relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${open ? "bg-accent" : "hover:bg-accent"}`}
        aria-label={`Notifications${total > 0 ? ` — ${total} unread` : ""}`}
      >
        <Bell className={`h-4 w-4 ${total > 0 ? "text-amber-300" : "text-muted-foreground"}`} />
        <Badge count={total} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="Notifications"
        >
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {total > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/25">
                  {total}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => refetch()}
                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Refresh"
                title={lastUpdated ? `Updated ${lastUpdated}` : "Refresh"}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("seats")}
              className={`flex-1 py-2 text-xs font-semibold transition-colors relative
                ${tab === "seats"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Armchair className="h-3.5 w-3.5" />
                Seats
                {lowSeats.length > 0 && (
                  <span className="text-[10px] px-1.5 rounded-full bg-amber-500/20 text-amber-300">
                    {lowSeats.length}
                  </span>
                )}
              </span>
              {tab === "seats" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setTab("files")}
              className={`flex-1 py-2 text-xs font-semibold transition-colors relative
                ${tab === "files"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <FileWarning className="h-3.5 w-3.5" />
                Files
                {incFiles.length > 0 && (
                  <span className="text-[10px] px-1.5 rounded-full bg-red-500/20 text-red-300">
                    {incFiles.length}
                  </span>
                )}
              </span>
              {tab === "files" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* body */}
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="space-y-px p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-lg p-3 animate-pulse" style={{ opacity: 1 - i * 0.2 }}>
                    <div className="h-7 w-7 rounded-lg bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/10 rounded w-3/4" />
                      <div className="h-2.5 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tab === "seats" ? (
              lowSeats.length === 0 ? (
                <EmptyState icon={Armchair} text="All sections have enough seats" />
              ) : (
                <ul className="p-1.5 space-y-0.5">
                  {lowSeats.map((s: LowSeatAlert) => {
                    const c = seatColor(s.available);
                    const key = `seat:${s.school}|${s.grade}|${s.section}`;
                    return (
                      <li key={key}
                        className="group flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors"
                      >
                        <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${c.badge} border`}>
                          <Armchair className={`h-3.5 w-3.5 ${c.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground leading-tight">
                            {s.grade} — Section {s.section}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{s.school}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${c.badge}`}>
                              {s.available === 0 ? "Full" : `${s.available} left`}
                            </span>
                            {/* capacity bar */}
                            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.dot}`}
                                style={{ width: `${Math.round((s.available / s.capacity) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{s.capacity}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => dismiss(key)}
                          className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all shrink-0 mt-0.5"
                          aria-label="Dismiss"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              incFiles.length === 0 ? (
                <EmptyState icon={CheckCheck} text="All student files are complete" />
              ) : (
                <ul className="p-1.5 space-y-0.5">
                  {incFiles.map((f: IncompleteFile) => {
                    const key = `file:${f.id}`;
                    return (
                      <li key={key}
                        className="group flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setOpen(false);
                          setLocation(`/students?highlight=${f.id}`);
                        }}
                      >
                        <div className="mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-orange-500/15 border border-orange-500/25">
                          <FileWarning className="h-3.5 w-3.5 text-orange-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground leading-tight truncate">
                            {f.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {f.studentId} · {f.grade}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          <button
                            onClick={e => { e.stopPropagation(); dismiss(key); }}
                            className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all"
                            aria-label="Dismiss"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            )}
          </div>

          {/* footer */}
          {!isLoading && (lowSeats.length > 0 || incFiles.length > 0) && (
            <div className="border-t border-border px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {lastUpdated ? `Updated ${lastUpdated}` : "Live data"}
              </span>
              <button
                onClick={() => {
                  setDismissed(new Set());
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Restore all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── empty state ── */
function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground leading-snug max-w-[180px]">{text}</p>
    </div>
  );
}
