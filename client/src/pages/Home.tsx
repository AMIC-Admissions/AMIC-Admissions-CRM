import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { KpiCard } from "@/components/KpiCard";
import { AlertTriangle, CheckCircle2, ClipboardList, Gauge, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardHeader }               from "@/components/dashboard/DashboardHeader";
import { ChartsSection }                 from "@/components/dashboard/ChartsSection";
import { FiltersSection, type Filters }  from "@/components/dashboard/FiltersSection";
import { DataTables }                    from "@/components/dashboard/DataTables";
import { AnalyticsCharts }               from "@/components/dashboard/AnalyticsCharts";
import { COPY, DASHBOARD_FALLBACK, type Lang } from "@/components/dashboard/types";

export default function Home() {
  const { user } = useAuth();
  const [lang, setLang]       = useState<Lang>("en");
  const [filters, setFilters] = useState<Filters>({ school: "", grade: "", from: "", to: "" });

  const t       = COPY[lang];
  const isAdmin = user?.role === "admin";

  const dashboard = trpc.admissions.getDashboard.useQuery(
    {
      school: filters.school || undefined,
      grade: filters.grade || undefined,
      from: filters.from ? new Date(filters.from) : undefined,
      to: filters.to ? new Date(filters.to) : undefined,
    },
    { enabled: isAdmin, staleTime: 120_000, gcTime: 600_000 }
  );
  const options = trpc.admissions.getFilterOptions.useQuery(undefined, {
    enabled: isAdmin, staleTime: 600_000, gcTime: 1_800_000, refetchOnWindowFocus: false,
  });

  const data = dashboard.data ?? DASHBOARD_FALLBACK;

  const last7 = useMemo(() => {
    const rows = data.dailyRegistrations ?? [];
    const tail = rows.slice(-7);
    while (tail.length < 7) tail.unshift({ date: "", count: 0 });
    return tail.map(r => r.count);
  }, [data.dailyRegistrations]);

  const cumulativeSpark = useMemo(() => {
    let cum = Math.max(0, data.totalStudents - last7.reduce((a, b) => a + b, 0));
    return last7.map(v => (cum += v, cum));
  }, [last7, data.totalStudents]);

  const kpis = [
    { label: t.totalStudents, value: data.totalStudents,
      previousValue: data.totalStudents - data.weeklyComparison.thisWeek + data.weeklyComparison.lastWeek,
      sparkData: cumulativeSpark, icon: Users, variant: "cyan" as const },
    { label: t.registered, value: data.registered,
      previousValue: data.weeklyComparison.lastWeek,
      sparkData: last7, icon: ClipboardList, variant: "purple" as const },
    { label: t.enrolled, value: data.enrolled,
      previousValue: data.weeklyComparison.lastWeek,
      sparkData: last7.map(v => Math.round(v * 0.6)), icon: CheckCircle2, variant: "green" as const },
    { label: t.seatsReserved, value: data.seatsReserved,
      previousValue: data.weeklyComparison.lastWeek,
      sparkData: last7.map((v, i) => Math.round(v * (1.2 + i * 0.05))), icon: Gauge, variant: "amber" as const },
    { label: t.seatsAvailable, value: data.seatsAvailable,
      icon: AlertTriangle, variant: "red" as const,
      subtext: data.seatsAvailable <= 3 ? "⚠ Low seat alert" : undefined },
  ];

  if (!isAdmin) {
    return (
      <div className="blueprint-bg min-h-screen p-4 sm:p-8">
        <Card className="technical-panel mx-auto mt-16 max-w-2xl text-white dimension-frame">
          <CardHeader>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">{t.protected}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <p>{user ? t.adminOnly : t.signInAdmin}</p>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">RBAC / SERVER PROTECTED</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="blueprint-bg min-h-screen" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <div className="container space-y-6 py-6 sm:py-8">

        <DashboardHeader
          t={t} lang={lang}
          onToggleLang={() => setLang(l => l === "en" ? "ar" : "en")}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map(kpi => (
            <KpiCard
              key={kpi.label}
              {...kpi}
              loading={dashboard.isLoading}
            />
          ))}
        </section>

        <ChartsSection t={t} data={data} />

        <FiltersSection
          t={t} filters={filters}
          schools={options.data?.schools ?? []}
          grades={options.data?.grades   ?? []}
          onChange={setFilters}
        />

        <DataTables t={t} data={data} />

        <AnalyticsCharts t={t} data={data} />

      </div>
    </div>
  );
}
