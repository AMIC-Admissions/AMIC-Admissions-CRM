import { type LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useMemo } from "react";

/* ── sparkline path from data points ── */
function buildSparklinePath(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  return pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C${cx},${prev.y.toFixed(1)} ${cx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, "");
}

/* ── colour config per card ── */
type KpiVariant = "cyan" | "green" | "amber" | "purple" | "red";

const VARIANT: Record<KpiVariant, {
  label: string; value: string; icon: string;
  spark: string; sparkFill: string; badge: string;
}> = {
  cyan:   {
    label: "text-cyan-200/60",   value: "text-white",
    icon:  "text-cyan-200",
    spark: "#67e8f9",            sparkFill: "rgba(103,232,249,0.12)",
    badge: "bg-white/10 text-white/70",
  },
  green:  {
    label: "text-emerald-200/60", value: "text-white",
    icon:  "text-emerald-300",
    spark: "#6ee7b7",             sparkFill: "rgba(110,231,183,0.12)",
    badge: "bg-white/10 text-white/70",
  },
  amber:  {
    label: "text-amber-200/60",  value: "text-white",
    icon:  "text-amber-300",
    spark: "#fcd34d",             sparkFill: "rgba(252,211,77,0.10)",
    badge: "bg-white/10 text-white/70",
  },
  purple: {
    label: "text-violet-200/60", value: "text-white",
    icon:  "text-violet-300",
    spark: "#c4b5fd",             sparkFill: "rgba(196,181,253,0.10)",
    badge: "bg-white/10 text-white/70",
  },
  red:    {
    label: "text-rose-200/60",   value: "text-white",
    icon:  "text-rose-300",
    spark: "#fca5a5",             sparkFill: "rgba(252,165,165,0.10)",
    badge: "bg-white/10 text-white/70",
  },
};

/* ── trend helpers ── */
type TrendDir = "up" | "down" | "flat";

function trendDir(current: number, previous: number): TrendDir {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function trendPct(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

/* ── props ── */
export type KpiCardProps = {
  label: string;
  value: number;
  /** Previous period value to compute trend */
  previousValue?: number;
  /** 7-day daily counts for sparkline */
  sparkData?: number[];
  icon: LucideIcon;
  variant?: KpiVariant;
  /** Override trend direction (e.g. "down" is good for pending payments) */
  invertTrend?: boolean;
  loading?: boolean;
  subtext?: string;
};

export function KpiCard({
  label, value, previousValue, sparkData,
  icon: Icon, variant = "cyan",
  invertTrend = false, loading = false, subtext,
}: KpiCardProps) {
  const c = VARIANT[variant];

  /* trend */
  const prev   = previousValue ?? 0;
  const dir    = previousValue !== undefined ? trendDir(value, prev) : "flat";
  const pct    = previousValue !== undefined ? trendPct(value, prev)  : null;
  /* "good" = up for students/enrollment, down for seats-pending */
  const isGood = invertTrend ? dir === "down" : dir === "up";
  const trendColor =
    dir === "flat"  ? "text-white/35" :
    isGood          ? "text-emerald-400" : "text-rose-400";

  /* sparkline */
  const spark = useMemo(() => {
    if (!sparkData || sparkData.length < 2) return null;
    const W = 96; const H = 32;
    const path = buildSparklinePath(sparkData, W, H);
    const fillPath = `${path} L${W},${H} L0,${H} Z`;
    return { path, fillPath, W, H, stroke: c.spark, fill: c.sparkFill };
  }, [sparkData, c]);

  /* skeleton */
  if (loading) {
    return (
      <div className="technical-panel rounded-xl p-5 space-y-3 animate-pulse">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-8 w-16 bg-white/10 rounded" />
        <div className="h-8 w-full bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="technical-panel rounded-xl p-5 flex flex-col gap-3 group hover:bg-white/[0.06] transition-colors">
      {/* top row: label + icon */}
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[11px] font-bold uppercase tracking-[0.22em] leading-tight ${c.label}`}>
          {label}
        </p>
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${c.icon}`} />
      </div>

      {/* value + trend */}
      <div className="flex items-end justify-between gap-2">
        <p className={`text-4xl font-black leading-none tabular-nums ${c.value}`}>
          {value.toLocaleString()}
        </p>

        {pct && dir !== "flat" && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
            {dir === "up"
              ? <TrendingUp  className="h-3.5 w-3.5" />
              : <TrendingDown className="h-3.5 w-3.5" />
            }
            <span>{pct}</span>
          </div>
        )}
        {dir === "flat" && pct && (
          <div className="flex items-center gap-0.5 text-xs font-semibold text-white/30">
            <Minus className="h-3.5 w-3.5" /> <span>—</span>
          </div>
        )}
      </div>

      {/* sparkline */}
      {spark ? (
        <svg
          width={spark.W} height={spark.H}
          viewBox={`0 0 ${spark.W} ${spark.H}`}
          className="w-full overflow-visible"
          aria-hidden="true"
        >
          <path d={spark.fillPath} fill={spark.fill} />
          <path
            d={spark.path}
            fill="none"
            stroke={spark.stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* last point dot */}
          {(() => {
            const vals  = sparkData!;
            const min   = Math.min(...vals);
            const max   = Math.max(...vals);
            const range = max - min || 1;
            const lx    = spark.W;
            const ly    = spark.H - ((vals[vals.length - 1] - min) / range) * spark.H;
            return <circle cx={lx} cy={ly} r="2.5" fill={spark.stroke} />;
          })()}
        </svg>
      ) : (
        /* empty placeholder so layout stays consistent */
        <div className="h-8" />
      )}

      {/* subtext */}
      {subtext && (
        <p className="text-[11px] text-white/40 leading-tight -mt-1">{subtext}</p>
      )}
    </div>
  );
}
