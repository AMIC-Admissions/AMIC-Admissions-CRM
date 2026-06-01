import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail, Plus, Trash2, Edit2, Play, CheckCircle2,
  Clock, Calendar, RefreshCw, AlertTriangle, X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/* ── constants ── */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, h) =>
  `${String(h).padStart(2, "0")}:00 UTC`
);

const REPORT_TYPES = [
  { value: "summary",           label: "Daily summary",           desc: "KPIs: total, registered, enrolled, seats" },
  { value: "at_risk",           label: "At-risk students",        desc: "Pending payment + not assessed + file incomplete" },
  { value: "school_comparison", label: "School comparison",       desc: "Side-by-side stats for all 3 schools" },
  { value: "full",              label: "Full report",             desc: "Summary + at-risk top 10" },
];

const TYPE_COLOR: Record<string, string> = {
  summary:           "bg-cyan-500/15 border-cyan-500/25 text-cyan-300",
  at_risk:           "bg-amber-500/15 border-amber-500/25 text-amber-300",
  school_comparison: "bg-violet-500/15 border-violet-500/25 text-violet-300",
  full:              "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
};

/* ── empty form ── */
const EMPTY = {
  name:       "",
  frequency:  "daily" as "daily" | "weekly",
  dayOfWeek:  1,
  hour:       7,
  recipients: [""],
  reportType: "summary" as "summary" | "at_risk" | "school_comparison" | "full",
  isActive:   true,
  filters:    { school: "", grade: "" },
};

/* ── schedule card ── */
function ScheduleCard({
  sched,
  onEdit,
  onDelete,
  onSendNow,
  isSending,
}: {
  sched: any;
  onEdit: () => void;
  onDelete: () => void;
  onSendNow: () => void;
  isSending: boolean;
}) {
  const tc = TYPE_COLOR[sched.reportType] ?? "bg-white/10 text-white/60";
  const lastSent = sched.lastSentAt
    ? new Date(sched.lastSentAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  const schedLabel = sched.frequency === "daily"
    ? `Daily at ${String(sched.hour).padStart(2, "0")}:00 UTC`
    : `Every ${DAYS[sched.dayOfWeek ?? 0]} at ${String(sched.hour).padStart(2, "0")}:00 UTC`;

  return (
    <div className={`technical-panel rounded-xl p-5 transition-opacity ${sched.isActive ? "" : "opacity-50"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white">{sched.name}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tc}`}>
              {REPORT_TYPES.find(t => t.value === sched.reportType)?.label ?? sched.reportType}
            </span>
            {!sched.isActive && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30">
                Paused
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/40">
            <Calendar className="h-3 w-3" />
            <span>{schedLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onSendNow} disabled={isSending}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-40 transition-colors"
            title="Send now">
            {isSending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          </button>
          <button onClick={onEdit}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-white/15 text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <Edit2 className="h-3 w-3" />
          </button>
          <button onClick={onDelete}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* recipients */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(sched.recipients as string[]).map((r: string) => (
          <span key={r} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
            <Mail className="h-3 w-3" /> {r}
          </span>
        ))}
      </div>

      {/* last sent */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/25">
          {lastSent ? `Last sent ${lastSent}` : "Never sent"}
        </span>
        {sched.filters?.school && (
          <span className="text-white/30">{sched.filters.school}</span>
        )}
      </div>
    </div>
  );
}

/* ── form ── */
function ScheduleForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: typeof EMPTY;
  onSave:   (data: typeof EMPTY) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (patch: Partial<typeof EMPTY>) => setForm(f => ({ ...f, ...patch }));

  const addRecipient    = () => set({ recipients: [...form.recipients, ""] });
  const setRecipient    = (i: number, v: string) => {
    const r = [...form.recipients]; r[i] = v; set({ recipients: r });
  };
  const removeRecipient = (i: number) => {
    if (form.recipients.length === 1) return;
    set({ recipients: form.recipients.filter((_, j) => j !== i) });
  };

  return (
    <div className="space-y-5">
      {/* name + type */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Schedule name</Label>
          <Input value={form.name} onChange={e => set({ name: e.target.value })}
            placeholder="e.g. Daily summary for admin" className="bg-white/5 border-white/15 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Report type</Label>
          <select value={form.reportType}
            onChange={e => set({ reportType: e.target.value as any })}
            className="w-full h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white">
            {REPORT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* frequency + day + hour */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Frequency</Label>
          <div className="flex rounded-lg overflow-hidden border border-white/15">
            {(["daily","weekly"] as const).map(f => (
              <button key={f} onClick={() => set({ frequency: f })}
                className={`flex-1 py-2 text-xs font-semibold transition-colors capitalize ${
                  form.frequency === f ? "bg-cyan-200 text-[#031844]" : "bg-white/5 text-white/50 hover:text-white"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {form.frequency === "weekly" && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Day of week</Label>
            <div className="flex rounded-lg overflow-hidden border border-white/15">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => set({ dayOfWeek: i })}
                  className={`flex-1 py-2 text-[10px] font-semibold transition-colors ${
                    form.dayOfWeek === i ? "bg-cyan-200 text-[#031844]" : "bg-white/5 text-white/50 hover:text-white"
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Send at (UTC)</Label>
          <select value={form.hour} onChange={e => set({ hour: Number(e.target.value) })}
            className="w-full h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white">
            {HOURS.map((h, i) => <option key={i} value={i}>{h}</option>)}
          </select>
        </div>
      </div>

      {/* recipients */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Recipients</Label>
        {form.recipients.map((r, i) => (
          <div key={i} className="flex gap-2">
            <Input
              type="email" value={r}
              onChange={e => setRecipient(i, e.target.value)}
              placeholder="admin@school.sa"
              className="flex-1 bg-white/5 border-white/15 text-white"
            />
            <button onClick={() => removeRecipient(i)} disabled={form.recipients.length === 1}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-white/15 text-white/30 hover:text-red-300 hover:border-red-500/30 disabled:opacity-20 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button onClick={addRecipient}
          className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-200 transition-colors mt-1">
          <Plus className="h-3.5 w-3.5" /> Add recipient
        </button>
      </div>

      {/* active toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => set({ isActive: !form.isActive })}
          className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? "bg-cyan-400" : "bg-white/15"}`}
          aria-checked={form.isActive} role="switch">
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className="text-sm text-white/60">{form.isActive ? "Active" : "Paused"}</span>
      </div>

      {/* actions */}
      <div className="flex gap-3 pt-2">
        <Button onClick={() => onSave(form)} disabled={isPending || !form.name || form.recipients.every(r => !r)}
          className="flex-1 bg-cyan-200 text-[#031844] hover:bg-white">
          {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Save schedule
        </Button>
        <Button variant="outline" onClick={onCancel} className="border-white/20 text-white/60 hover:bg-white/10">
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ── main component ── */
export function ScheduledReports() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);

  const { data: schedules = [], isLoading } = trpc.admin.listSchedules.useQuery(undefined, {
    staleTime: 30_000,
  });

  const createMut = trpc.admin.createSchedule.useMutation({
    onSuccess: async () => {
      toast.success("Schedule created");
      setShowForm(false);
      await utils.admin.listSchedules.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const updateMut = trpc.admin.updateSchedule.useMutation({
    onSuccess: async () => {
      toast.success("Schedule updated");
      setEditTarget(null);
      await utils.admin.listSchedules.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const deleteMut = trpc.admin.deleteSchedule.useMutation({
    onSuccess: async () => {
      toast.success("Schedule deleted");
      await utils.admin.listSchedules.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const sendNowMut = trpc.admin.sendNow.useMutation({
    onSuccess: (r) => {
      setSendingId(null);
      if (r.ok) toast.success(`Report sent via ${r.method}`);
      else      toast.error("Send failed — check server logs");
      utils.admin.listSchedules.invalidate();
    },
    onError: e => { setSendingId(null); toast.error(e.message); },
  });

  const handleSave = (form: typeof EMPTY) => {
    const payload = {
      ...form,
      recipients: form.recipients.filter(Boolean),
      dayOfWeek:  form.frequency === "weekly" ? form.dayOfWeek : null,
      filters:    form.filters.school || form.filters.grade
        ? { school: form.filters.school || undefined, grade: form.filters.grade || undefined }
        : undefined,
    };
    if (editTarget) updateMut.mutate({ id: editTarget.id, ...payload });
    else            createMut.mutate(payload);
  };

  const openEdit = (sched: any) => {
    setEditTarget(sched);
    setShowForm(false);
  };

  return (
    <div className="space-y-5">

      {/* ── SMTP status banner ── */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-white/70 space-y-1">
          <p className="font-semibold text-amber-300">Setup required for email delivery</p>
          <p>Without SMTP vars, reports are sent as push notifications via the owner channel. To enable actual email:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs text-white/50 mt-1">
            <li>Run: <code className="bg-white/10 px-1 py-0.5 rounded text-white/70">pnpm add nodemailer node-cron @types/nodemailer @types/node-cron</code></li>
            <li>Add to <code className="bg-white/10 px-1 py-0.5 rounded text-white/70">.env</code>: <code className="bg-white/10 px-1 py-0.5 rounded text-white/70">SMTP_HOST · SMTP_PORT · SMTP_USER · SMTP_PASS</code></li>
            <li>Call <code className="bg-white/10 px-1 py-0.5 rounded text-white/70">startReportScheduler()</code> in <code className="bg-white/10 px-1 py-0.5 rounded text-white/70">server/_core/index.ts</code></li>
          </ol>
        </div>
      </div>

      {/* ── header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-300" /> Scheduled Reports
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {schedules.length} schedule{schedules.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        {!showForm && !editTarget && (
          <Button onClick={() => setShowForm(true)}
            className="border border-cyan-200/40 bg-cyan-200 text-[#031844] hover:bg-white gap-1.5">
            <Plus className="h-4 w-4" /> New schedule
          </Button>
        )}
      </div>

      {/* ── create form ── */}
      {showForm && (
        <Card className="technical-panel text-white">
          <CardHeader>
            <CardTitle className="text-base font-black uppercase">New schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleForm
              initial={EMPTY}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
              isPending={createMut.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* ── edit form ── */}
      {editTarget && (
        <Card className="technical-panel text-white border border-cyan-200/20">
          <CardHeader>
            <CardTitle className="text-base font-black uppercase">Edit — {editTarget.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleForm
              initial={{
                name:       editTarget.name,
                frequency:  editTarget.frequency,
                dayOfWeek:  editTarget.dayOfWeek ?? 1,
                hour:       editTarget.hour,
                recipients: editTarget.recipients as string[],
                reportType: editTarget.reportType,
                isActive:   editTarget.isActive,
                filters:    editTarget.filters ?? { school: "", grade: "" },
              }}
              onSave={handleSave}
              onCancel={() => setEditTarget(null)}
              isPending={updateMut.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* ── schedules list ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="technical-panel rounded-xl p-5 space-y-3 animate-pulse" style={{ opacity: 1 - i * 0.2 }}>
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-3 w-32 bg-white/10 rounded" />
              <div className="h-6 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : schedules.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border border-dashed border-white/10">
          <Mail className="h-10 w-10 text-white/15" />
          <p className="text-sm text-white/35">No schedules yet. Create one to start sending automated reports.</p>
          <Button onClick={() => setShowForm(true)} variant="outline"
            className="border-white/20 text-white/50 hover:bg-white/10 gap-1.5">
            <Plus className="h-4 w-4" /> Create first schedule
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {schedules.map((sched: any) => (
            <ScheduleCard
              key={sched.id}
              sched={sched}
              onEdit={() => openEdit(sched)}
              onDelete={() => deleteMut.mutate({ id: sched.id })}
              onSendNow={() => { setSendingId(sched.id); sendNowMut.mutate({ id: sched.id }); }}
              isSending={sendingId === sched.id && sendNowMut.isPending}
            />
          ))}
        </div>
      )}

    </div>
  );
}
