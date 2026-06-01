import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardData, T } from "./types";
import { NationalityChart } from "./NationalityChart";

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

interface Props {
  t: T;
  data: DashboardData;
}

export function ChartsSection({ t, data }: Props) {
  return (
    <>
    <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      {/* Daily registrations bar chart */}
      <Card className="technical-panel text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black uppercase">
            <Gauge className="h-5 w-5 text-cyan-200" />
            {t.dailyRegistrations}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {data.dailyRegistrations.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyRegistrations}>
                <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.65)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.65)" allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#9be8ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <StateMessage text={t.noData} />
          )}
        </CardContent>
      </Card>

      {/* Weekly comparison */}
      <Card className="technical-panel text-white">
        <CardHeader>
          <CardTitle className="text-xl font-black uppercase">{t.weeklyComparison}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {([
            [t.thisWeek, data.weeklyComparison.thisWeek],
            [t.lastWeek, data.weeklyComparison.lastWeek],
          ] as [string, number][]).map(([label, value]) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-[0.18em] text-white/75">
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-sm border border-white/15 bg-white/10">
                <div
                  className="h-full bg-cyan-200"
                  style={{ width: `${Math.min(100, value * 8)}%` }}
                />
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-cyan-200/25 bg-cyan-200/10 p-4 text-sm text-cyan-50">
            {t.workflowNote}
          </div>
        </CardContent>
      </Card>
    </section>

    <NationalityChart data={data} />
    </>
  );
}
