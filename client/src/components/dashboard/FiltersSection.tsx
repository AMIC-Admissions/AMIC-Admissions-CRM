import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import type { T } from "./types";

export interface Filters {
  school: string;
  grade: string;
  from: string;
  to: string;
}

interface Props {
  t: T;
  filters: Filters;
  schools: string[];
  grades: string[];
  onChange: (filters: Filters) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/80">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function FiltersSection({ t, filters, schools, grades, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <section className="technical-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-lg font-black uppercase text-white">
        <Search className="h-5 w-5 text-cyan-200" />
        {t.filters}
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label={t.dateFrom}>
          <Input
            type="date"
            value={filters.from}
            onChange={e => set({ from: e.target.value })}
          />
        </Field>
        <Field label={t.dateTo}>
          <Input
            type="date"
            value={filters.to}
            onChange={e => set({ to: e.target.value })}
          />
        </Field>
        <Field label={t.school}>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-white"
            value={filters.school}
            onChange={e => set({ school: e.target.value })}
          >
            <option value="">{t.allSchools}</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label={t.grade}>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-white"
            value={filters.grade}
            onChange={e => set({ grade: e.target.value })}
          >
            <option value="">{t.allGrades}</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
      </div>
    </section>
  );
}
