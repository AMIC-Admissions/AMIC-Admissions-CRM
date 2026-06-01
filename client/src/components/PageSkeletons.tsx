/**
 * PageSkeletons.tsx
 * Skeleton loading screens for every page.
 * Place this file at: client/src/components/PageSkeletons.tsx
 */

/* ── shared pulse block ── */
function S({
  w = "w-full", h = "h-4", rounded = "rounded",
  className = "",
}: {
  w?: string; h?: string; rounded?: string; className?: string;
}) {
  return (
    <div
      className={`bg-white/10 animate-pulse ${w} ${h} ${rounded} ${className}`}
    />
  );
}

/* ── shared header banner ── */
function HeaderBanner() {
  return (
    <section className="technical-panel dimension-frame rounded-2xl p-5 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <S w="w-56" h="h-8" rounded="rounded-lg" />
          <S w="w-80" h="h-4" rounded="rounded" />
        </div>
        <div className="flex gap-2">
          <S w="w-24" h="h-9" rounded="rounded-lg" />
          <S w="w-24" h="h-9" rounded="rounded-lg" />
          <S w="w-32" h="h-9" rounded="rounded-lg" />
        </div>
      </div>
    </section>
  );
}

/* ── shared table rows ── */
function TableRows({ rows = 7, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden">
      {/* thead */}
      <div className="flex gap-4 border-b border-white/10 bg-white/5 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <S key={i} w="flex-1" h="h-3" rounded="rounded" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-white/[0.06] px-4 py-3"
          style={{ opacity: 1 - r * 0.09 }}
        >
          {/* expand chevron */}
          <S w="w-4" h="h-4" rounded="rounded" />
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <S key={c} w="flex-1" h={c === 0 ? "h-4" : "h-3"} rounded="rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOME / DASHBOARD skeleton
   ═══════════════════════════════════════════ */
export function HomeSkeleton() {
  return (
    <div className="blueprint-bg min-h-screen">
      <div className="container space-y-6 py-6 sm:py-8">

        {/* header banner */}
        <section className="technical-panel dimension-frame rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <S w="w-40" h="h-5" rounded="rounded" />
              <S w="w-full" h="h-10" rounded="rounded-lg" />
              <S w="w-96" h="h-4" rounded="rounded" />
            </div>
            <S w="w-28" h="h-9" rounded="rounded-lg" />
          </div>
        </section>

        {/* KPI cards row */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="technical-panel rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <S w="w-24" h="h-3" rounded="rounded" />
                <S w="w-5" h="h-5" rounded="rounded" />
              </div>
              <S w="w-16" h="h-9" rounded="rounded-lg" />
              <S w="w-full" h="h-8" rounded="rounded" />
            </div>
          ))}
        </section>

        {/* Charts row */}
        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          {/* bar chart */}
          <div className="technical-panel rounded-xl p-5 space-y-4">
            <S w="w-48" h="h-5" rounded="rounded" />
            <div className="flex items-end gap-2 h-64 pt-4">
              {[55, 80, 45, 90, 65, 75, 50, 85, 70, 95, 60, 40].map((pct, i) => (
                <div
                  key={i}
                  className="flex-1 bg-white/10 animate-pulse rounded-t"
                  style={{ height: `${pct}%`, animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>
          {/* weekly comparison */}
          <div className="technical-panel rounded-xl p-5 space-y-5">
            <S w="w-40" h="h-5" rounded="rounded" />
            {[75, 55].map((pct, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <S w="w-20" h="h-3" rounded="rounded" />
                  <S w="w-8"  h="h-3" rounded="rounded" />
                </div>
                <div className="h-4 rounded-sm bg-white/5 overflow-hidden">
                  <div className="h-full bg-white/10 animate-pulse rounded-sm" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
            <S w="w-full" h="h-20" rounded="rounded-lg" />
          </div>
        </section>

        {/* Filters bar */}
        <section className="technical-panel rounded-2xl p-4 sm:p-5 space-y-3">
          <S w="w-32" h="h-5" rounded="rounded" />
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <S w="w-20" h="h-3" rounded="rounded" />
                <S w="w-full" h="h-10" rounded="rounded-lg" />
              </div>
            ))}
          </div>
        </section>

        {/* School breakdown table */}
        <div className="technical-panel rounded-xl overflow-hidden">
          <div className="p-5">
            <S w="w-44" h="h-5" rounded="rounded" />
          </div>
          <TableRows rows={4} cols={6} />
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STUDENTS skeleton
   ═══════════════════════════════════════════ */
export function StudentsSkeleton() {
  return (
    <div className="blueprint-bg min-h-screen">
      <div className="container space-y-5 py-6 sm:py-8">
        <HeaderBanner />

        {/* table card */}
        <div className="technical-panel rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <S w="w-28" h="h-5" rounded="rounded" />
            {/* column toggle button placeholder */}
            <S w="w-28" h="h-9" rounded="rounded-lg" />
          </div>
          <TableRows rows={10} cols={8} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SEAT AVAILABILITY skeleton
   ═══════════════════════════════════════════ */
export function SeatAvailabilitySkeleton() {
  return (
    <div className="blueprint-bg min-h-screen">
      <div className="container space-y-6 py-6 sm:py-8">

        {/* header */}
        <section className="technical-panel dimension-frame rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <S w="w-48" h="h-8" rounded="rounded-lg" />
              <S w="w-64" h="h-4" rounded="rounded" />
            </div>
            <div className="flex gap-2">
              <S w="w-32" h="h-9" rounded="rounded-lg" />
              <S w="w-32" h="h-9" rounded="rounded-lg" />
              <S w="w-32" h="h-9" rounded="rounded-lg" />
            </div>
          </div>
        </section>

        {/* summary KPI row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {["Total Capacity", "Reserved", "Available"].map((_, i) => (
            <div key={i} className="technical-panel rounded-xl p-5 space-y-3">
              <S w="w-28" h="h-3" rounded="rounded" />
              <S w="w-20" h="h-9" rounded="rounded-lg" />
              <S w="w-full" h="h-2" rounded="rounded-full" />
            </div>
          ))}
        </div>

        {/* seats grid */}
        <div className="technical-panel rounded-xl overflow-hidden">
          <div className="p-5">
            <S w="w-36" h="h-5" rounded="rounded" />
          </div>
          <TableRows rows={8} cols={6} />
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORTS skeleton
   ═══════════════════════════════════════════ */
export function ReportsSkeleton() {
  return (
    <div className="blueprint-bg min-h-screen">
      <div className="container space-y-6 py-6 sm:py-8">

        {/* header */}
        <section className="technical-panel dimension-frame rounded-2xl p-5 sm:p-8">
          <div className="space-y-3">
            <S w="w-32" h="h-8" rounded="rounded-lg" />
            <S w="w-96" h="h-4" rounded="rounded" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          {/* filter panel */}
          <div className="space-y-4">
            {/* quick filters */}
            <div className="technical-panel rounded-xl p-4 space-y-3">
              <S w="w-28" h="h-4" rounded="rounded" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <S w="w-4" h="h-4" rounded="rounded" />
                  <S w="w-full" h="h-4" rounded="rounded" />
                </div>
              ))}
            </div>
            {/* filter sections */}
            {["Student Filters", "Academic Filters", "Payment Filters"].map((_, i) => (
              <div key={i} className="technical-panel rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <S w="w-28" h="h-4" rounded="rounded" />
                  <S w="w-4"  h="h-4" rounded="rounded" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <S w="w-4" h="h-4" rounded="rounded" />
                      <S w="w-28" h="h-3" rounded="rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* results panel */}
          <div className="space-y-4">
            {/* field selector */}
            <div className="technical-panel rounded-xl p-4 space-y-3">
              <S w="w-40" h="h-4" rounded="rounded" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <S key={i} w="w-24" h="h-7" rounded="rounded-full" />
                ))}
              </div>
            </div>
            {/* generate button */}
            <S w="w-full" h="h-10" rounded="rounded-lg" />
            {/* results table */}
            <div className="technical-panel rounded-xl overflow-hidden">
              <div className="p-5 flex justify-between items-center">
                <S w="w-36" h="h-5" rounded="rounded" />
                <div className="flex gap-2">
                  <S w="w-28" h="h-9" rounded="rounded-lg" />
                  <S w="w-28" h="h-9" rounded="rounded-lg" />
                </div>
              </div>
              <TableRows rows={6} cols={6} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   USERS skeleton
   ═══════════════════════════════════════════ */
export function UsersSkeleton() {
  return (
    <div className="blueprint-bg min-h-screen">
      <div className="container space-y-5 py-6 sm:py-8">

        {/* header */}
        <section className="technical-panel dimension-frame rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <S w="w-48" h="h-8" rounded="rounded-lg" />
              <S w="w-72" h="h-4" rounded="rounded" />
            </div>
            <S w="w-28" h="h-9" rounded="rounded-lg" />
          </div>
        </section>

        {/* search bar */}
        <div className="technical-panel rounded-xl p-4">
          <div className="flex gap-2 items-center">
            <S w="w-5" h="h-5" rounded="rounded" />
            <S w="w-full" h="h-9" rounded="rounded-lg" />
          </div>
        </div>

        {/* users table */}
        <div className="technical-panel rounded-xl overflow-hidden">
          <div className="p-5">
            <S w="w-20" h="h-5" rounded="rounded" />
          </div>
          <TableRows rows={6} cols={5} />
        </div>

      </div>
    </div>
  );
}
