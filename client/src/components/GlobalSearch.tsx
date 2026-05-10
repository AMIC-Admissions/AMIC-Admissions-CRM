import { trpc } from "@/lib/trpc";
import { Search, X, User, GraduationCap, Hash } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";

type SearchResult = {
  id: number;
  name: string;
  studentId: string;
  grade: string;
  school: string;
  gender: "Male" | "Female";
  status: string;
  seatReserved: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  Registered: "bg-blue-500/15 text-blue-400",
  Assessed:   "bg-yellow-500/15 text-yellow-400",
  Passed:     "bg-green-500/15 text-green-400",
  Enrolled:   "bg-emerald-500/15 text-emerald-400",
  Withdrawn:  "bg-red-500/15 text-red-400",
};

export function GlobalSearch() {
  const [query, setQuery]           = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [open, setOpen]             = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const [, setLocation]             = useLocation();
  const inputRef  = useRef<HTMLInputElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<any>(null);

  /* ── debounce ── */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length >= 2) {
      timerRef.current = setTimeout(() => setDebouncedQ(query.trim()), 300);
    } else {
      setDebouncedQ("");
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  /* ── search — fresh results, short cache ── */
  const { data, isFetching } = trpc.admissions.searchStudents.useQuery(
    { query: debouncedQ, limit: 8 },
    { enabled: debouncedQ.length >= 2, staleTime: 10_000, gcTime: 60_000, refetchOnWindowFocus: false }
  );
  const results = (data ?? []) as SearchResult[];

  /* ── open/close ── */
  useEffect(() => {
    setOpen(debouncedQ.length >= 2);
    setActiveIdx(-1);
  }, [debouncedQ]);

  /* ── click outside ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Ctrl/Cmd + K shortcut ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── keyboard navigation ── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectResult(results[activeIdx]);
    }
  }, [open, results, activeIdx]);

  const selectResult = (r: SearchResult) => {
    setOpen(false);
    setQuery("");
    setDebouncedQ("");
    setLocation(`/students?highlight=${r.id}`);
  };

  const clear = () => {
    setQuery("");
    setDebouncedQ("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-xl">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => debouncedQ.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search students — name, ID, grade…"
          className="w-full h-9 pl-9 pr-20 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          aria-label="Global student search"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={clear}
              className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted border border-border rounded">
            <span>⌘</span><span>K</span>
          </kbd>
        </div>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
          role="listbox"
        >
          {isFetching ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No students found for "{debouncedQ}"
            </div>
          ) : (
            <ul className="py-1">
              {results.map((r, i) => (
                <li
                  key={r.id}
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => selectResult(r)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    i === activeIdx ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    r.gender === "Female"
                      ? "bg-pink-500/15 text-pink-400"
                      : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{r.name}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />{r.studentId}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap className="h-3 w-3" />{r.grade}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <User className="h-3 w-3" />{r.school}
                      </span>
                    </div>
                  </div>
                </li>
              ))}

              {results.length === 8 && (
                <li className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                  Showing top 8 results — refine your search for more
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
