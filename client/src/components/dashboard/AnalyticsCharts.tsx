import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardData, T } from "./types";

function StateMessage({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
      {text}
    </div>
  );
}

const TOOLTIP_STYLE = {
  background: "#061f5c",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "white",
};

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

const STAGES = [
  { key: "totalStudents", label: "Registered", color: "#378ADD", light: "#5b9de8" },
  { key: "assessed",      label: "Assessed",   color: "#7F77DD", light: "#a99eee" },
  { key: "passed",        label: "Passed",     color: "#1D9E75", light: "#35c994" },
  { key: "enrolled",      label: "Enrolled",   color: "#0F6E56", light: "#1aad87" },
];

function convColor(r: number) {
  return r >= 70 ? { bg: "rgba(29,158,117,0.25)", border: "#1D9E75", text: "#34d399" }
       : r >= 40 ? { bg: "rgba(245,158,11,0.25)",  border: "#f59e0b", text: "#fcd34d" }
       :           { bg: "rgba(239,68,68,0.25)",    border: "#ef4444", text: "#fca5a5" };
}

function AdmissionFunnel({ data }: { data: DashboardData }) {
  const values = STAGES.map(s => (data as any)[s.key] as number ?? 0);
  const max    = values[0] || 1;

  const W      = 520;
  const H      = 300;
  const PY     = 10;
  const blockH = (H - PY * (STAGES.length - 1)) / STAGES.length;
  const minW   = 80;
  const maxW   = W - 60;

  const widths = values.map(v => minW + ((v / max) * (maxW - minW)));
  const cx     = W / 2;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="overflow-visible" role="img" aria-label="Admission pipeline funnel">
        <defs>
          {STAGES.map((s, i) => (
            <linearGradient key={i} id={`fg-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.light} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {STAGES.map((stage, i) => {
          const topW = widths[i];
          const botW = i < STAGES.length - 1 ? widths[i + 1] : widths[i];
          const y    = i * (blockH + PY);
          const path = `M${cx - topW/2},${y} L${cx + topW/2},${y} L${cx + botW/2},${y + blockH} L${cx - botW/2},${y + blockH} Z`;
          const val  = values[i];
          const conv = i > 0 ? pct(val, values[i - 1]) : 100;
          const cc   = convColor(conv);

          return (
            <g key={stage.key}>
              <path d={path} fill={stage.color} opacity={0.82} />
              <path d={path} fill={`url(#fg-${i})`} />

              {/* stage name — left */}
              <text x={cx - topW/2 - 10} y={y + blockH/2} textAnchor="end" dominantBaseline="middle"
                fontSize={10} fontWeight={700} fill="rgba(255,255,255,0.5)"
                style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {stage.label}
              </text>

              {/* count — center */}
              <text x={cx} y={y + blockH/2 - 5} textAnchor="middle" dominantBaseline="middle"
                fontSize={20} fontWeight={900} fill="#fff">
                {val.toLocaleString()}
              </text>

              {/* conversion rate pill — right */}
              {i > 0 && (
                <g>
                  <rect x={cx + topW/2 + 8} y={y + blockH/2 - 11} width={54} height={22}
                    rx={5} fill={cc.bg} stroke={cc.border} strokeWidth={0.5} />
                  <text x={cx + topW/2 + 35} y={y + blockH/2} textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fontWeight={800} fill={cc.text}>
                    {conv}%
                  </text>
                </g>
              )}

              {/* dashed connector between stages */}
              {i < STAGES.length - 1 && (
                <line x1={cx} y1={y + blockH + 1} x2={cx} y2={y + blockH + PY - 1}
                  stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="3 2" />
              )}
            </g>
          );
        })}
      </svg>

      {/* step-by-step pills */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {STAGES.slice(1).map((stage, i) => {
          const from  = values[i];
          const to    = values[i + 1];
          const drop  = from - to;
          const ratio = pct(to, from);
          const cc    = convColor(ratio);
          return (
            <div key={stage.key}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border"
              style={{ background: cc.bg, borderColor: cc.border, color: cc.text }}>
              <span className="text-white/40">{STAGES[i].label} → {stage.label}</span>
              <span className="font-black">{ratio}%</span>
              {drop > 0 && <span className="text-white/30 text-[10px]">−{drop.toLocaleString()}</span>}
            </div>
          );
        })}
      </div>

      {/* overall summary box */}
      {values[0] > 0 && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">
            Overall · Registered → Enrolled
          </p>
          <p className="text-2xl font-black text-white">
            {pct(values[3], values[0])}%
            <span className="text-sm font-normal text-white/35 ml-2">
              ({values[3].toLocaleString()} / {values[0].toLocaleString()})
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

interface Props { t: T; data: DashboardData; }

export function AnalyticsCharts({ t, data }: Props) {
  const capacityData = (data.seatUtilization?.byGrade ?? []).map((seat: any) => ({
    grade:     seat.grade,
    capacity:  seat.capacity ?? 0,
    reserved:  seat.reserved ?? 0,
    available: (seat.capacity ?? 0) - (seat.reserved ?? 0),
  }));

  return (
    <>
      <section>
        <Card className="technical-panel text-white">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase">{t.capacityVsRegistered}</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {capacityData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityData} barGap={2}>
                  <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
                  <XAxis dataKey="grade" stroke="rgba(255,255,255,0.65)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.65)" allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="capacity"  name="Capacity"  fill="#9be8ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reserved"  name="Reserved"  fill="#fcd34d" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="available" name="Available" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <StateMessage text={t.noData} />
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="technical-panel text-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl font-black uppercase">{t.admissionPipeline}</CardTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-right">
                Conversion rates shown between stages →
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {data.totalStudents > 0 ? (
              <AdmissionFunnel data={data} />
            ) : (
              <StateMessage text={t.noData} />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
