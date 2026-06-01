import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import type { Lang, T } from "./types";

interface Props {
  t: T;
  lang: Lang;
  onToggleLang: () => void;
}

export function DashboardHeader({ t, lang, onToggleLang }: Props) {
  return (
    <section className="technical-panel dimension-frame overflow-hidden rounded-2xl p-5 sm:p-8">
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <div className="mb-3 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-cyan-100">
            <span>CAD-ADM-2026</span>
            <span className="h-1 w-1 rounded-full bg-cyan-200" />
            <span>{t.protected}</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-medium text-white/75 sm:text-lg">
            {t.subtitle}
          </p>
        </div>
        <Button
          className="border border-cyan-200/40 bg-cyan-200 text-[#031844] hover:bg-white"
          onClick={onToggleLang}
        >
          <Languages className="h-4 w-4" />
          {lang === "en" ? "العربية" : "English"}
        </Button>
      </div>
    </section>
  );
}
