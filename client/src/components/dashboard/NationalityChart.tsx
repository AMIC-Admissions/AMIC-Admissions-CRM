import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, Legend, XAxis, YAxis,
} from "recharts";
import type { DashboardData } from "./types";

/* ── colours ── */
const C_SAUDI     = "#67e8f9";   // cyan
const C_NONSAUDI  = "#c4b5fd";   // violet
const C_SAUDI_DIM = "rgba(103,232,249,0.15)";
const C_NS_DIM    = "rgba(196,181,253,0.15)";

const TOOLTIP_STYLE = {
  background: "#061f5c",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "white",
  fontSize: 12,
};

/* ── SVG donut ── */
function Donut({
  saudi, nonSaudi, size = 140,
}: { saudi: number; nonSaudi: number; size?: number }) {
  const total = saudi + nonSaudi || 1;
  const saudiPct = saudi / total;

  const r   = (size - 20) / 2;
  const cx  = size / 2;
  const cy  = size / 2;
  const circ = 2 * Math.PI * r;

  /* Saudi arc (starts at top = -90°) */
  const saudiDash = saudiPct * circ;
  const nsDash    = (1 - saudiPct) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Nationality donut chart" role="img">
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={18} />

      {/* Non-Saudi arc (drawn first, underneath) */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={C_NONSAUDI}
        strokeWidth={18}
        strokeDasharray={`${nsDash} ${circ - nsDash}`}
        strokeDashoffset={-saudiDash}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity={0.85}
      />

      {/* Saudi arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={C_SAUDI}
        strokeWidth={18}
        strokeDasharray={`${saudiDash} ${circ - saudiDash}`}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity={0.85}
      />

      {/* centre text */}
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle"
        fontSize={22} fontWeight={900} fill="#fff">
        {Math.round(saudiPct * 100)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fontWeight={700} fill="rgba(255,255,255,0.4)"
        style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Saudi
      </text>
    </svg>
  );
}

/* ── legend pill ── */
function Pill({ color, label, count, pct }: { color: string; label: string; count: number; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/70">{label}</span>
          <span className="text-xs font-black text-white tabular-nums">{count.toLocaleString()}</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

/* ── main component ── */
interface Props {
  data: DashboardData;
}

export function NationalityChart({ data }: Props) {
  const { saudi, nonSaudi, total } = data.nationalitySummary;
  const saudiPct    = total > 0 ? Math.round((saudi    / total) * 100) : 0;
  const nonSaudiPct = total > 0 ? Math.round((nonSaudi / total) * 100) : 0;

  /* stacked bar data per school */
  const barData = data.nationalityBySchool.map(s => ({
    school: s.school
      .replace("AMIS ", "")
      .replace("Kids Gate", "KG"),
    Saudi:     s.saudi,
    "Non-Saudi": s.nonSaudi,
  }));

  const hasData = total > 0;

  return (
    <Card className="technical-panel text-white">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase">
          Nationality breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-semibold uppercase tracking-widest text-white/40">
            No data
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">

            {/* left: donut + legend */}
            <div className="flex flex-col items-center gap-5 lg:items-start">
              <Donut saudi={saudi} nonSaudi={nonSaudi} />
              <div className="w-full space-y-3 max-w-[200px]">
                <Pill color={C_SAUDI}    label="Saudi"     count={saudi}    pct={saudiPct}    />
                <Pill color={C_NONSAUDI} label="Non-Saudi" count={nonSaudi} pct={nonSaudiPct} />
                <p className="text-[10px] text-white/25 text-center pt-1 font-mono">
                  Total {total.toLocaleString()} students
                </p>
              </div>
            </div>

            {/* right: stacked bar per school */}
            {barData.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
                  Per school
                </p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} barSize={32} barGap={4}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="school" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v: number, name: string) => [v.toLocaleString(), name]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)", paddingTop: 8 }}
                      />
                      <Bar dataKey="Saudi"     stackId="a" fill={C_SAUDI}    radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Non-Saudi" stackId="a" fill={C_NONSAUDI} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
