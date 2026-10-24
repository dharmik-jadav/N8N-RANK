"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { openSubmit } from "@/lib/submit";
import type { Workflow } from "@/lib/data";
import { CATEGORIES } from "@/lib/categories";
import CategoryChips from "./CategoryChips";
import { GridCard, ListRow } from "./WorkflowCards";

type View = "grid" | "list";
type Sort = "bid" | "clicks" | "new";

const SORTS: { id: Sort; label: string }[] = [
  { id: "bid", label: "Top bid" },
  { id: "clicks", label: "Most clicks" },
  { id: "new", label: "Newest" },
];

const GridIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

export default function WorkflowBrowser({ workflows }: { workflows: Workflow[] }) {
  // Filters live in the URL (?q=slack&category=E-commerce&sort=new&view=grid) so a filtered list can be shared.
  const params = useSearchParams();
  const [cat, setCat] = useState(() => {
    const c = params.get("category");
    return c && (CATEGORIES as readonly string[]).includes(c) ? c : "All";
  });
  const [q, setQ] = useState(() => (params.get("q") ?? "").slice(0, 80));
  const [sort, setSort] = useState<Sort>(() => {
    const s = params.get("sort");
    return s === "clicks" || s === "new" ? s : "bid";
  });
  const [view, setView] = useState<View>(() => (params.get("view") === "grid" ? "grid" : "list"));
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const set = (k: string, v: string, def: string) => (v && v !== def ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set("category", cat, "All");
    set("q", q.trim(), "");
    set("sort", sort, "bid");
    set("view", view, "list");
    window.history.replaceState(null, "", url);
  }, [cat, q, sort, view]);

  // "/" or Ctrl/Cmd+K focuses the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        search.current?.focus();
        search.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Rank is the position in the default order (highest bid first) and stays the same whichever sort is chosen.
  const ranked = useMemo(() => workflows.map((w, i) => ({ w, rank: i + 1 })), [workflows]);

  const items = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    let list = ranked.filter(({ w }) => {
      if (cat !== "All" && w.category !== cat) return false;
      if (!words.length) return true;
      const hay = `${w.title} ${w.description} ${w.category} ${w.apps.join(" ")}`.toLowerCase();
      return words.every((word) => hay.includes(word));
    });
    if (sort === "clicks") list = [...list].sort((a, b) => b.w.clicks - a.w.clicks || a.rank - b.rank);
    if (sort === "new") list = [...list].sort((a, b) => b.w.created.localeCompare(a.w.created));
    return list;
  }, [ranked, cat, q, sort]);

  const filtered = cat !== "All" || q.trim() !== "";
  const clear = () => { setCat("All"); setQ(""); };

  return (
    <section id="workflows" className="mx-auto w-full max-w-7xl px-4 pb-20">
      <div className="sticky top-[var(--header-h,4.75rem)] z-20 -mx-4 space-y-3 border-b border-border bg-black/80 px-4 py-3 backdrop-blur transition-[top] duration-300 ease-out">
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
          <label className="relative order-1 min-w-0 flex-1 basis-full sm:basis-auto">
            <span className="sr-only">Search workflows</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={search}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (q ? setQ("") : e.currentTarget.blur())}
              placeholder="Search by title or app, e.g. Slack, OpenAI"
              maxLength={80}
              className="h-10 w-full rounded-full border border-border bg-black pl-10 pr-14 text-sm outline-none placeholder:text-white/40 focus:border-white [&::-webkit-search-cancel-button]:hidden"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 text-[10px] text-white/50 sm:block">/</kbd>
          </label>

          <div role="group" aria-label="Sort by" className="no-scrollbar order-3 flex min-w-0 gap-1 overflow-x-auto sm:order-2">
            {SORTS.map((s) => (
              <button key={s.id} onClick={() => setSort(s.id)} aria-pressed={sort === s.id}
                className={`btn-run btn-chip shrink-0 px-3 py-1.5 text-xs ${sort === s.id ? "is-active" : ""}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="order-2 flex shrink-0 rounded-full border border-border p-0.5 sm:order-3">
            {([["list", ListIcon, "List view"], ["grid", GridIcon, "Grid view"]] as const).map(([v, Icon, label]) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} aria-label={label} title={label}
                className={`grid h-8 w-8 place-items-center rounded-full ${view === v ? "bg-white text-black" : "text-muted hover:text-white"}`}>
                <Icon />
              </button>
            ))}
          </div>
        </div>

        <CategoryChips value={cat} onChange={setCat} />
      </div>

      <div className="mb-5 mt-8 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{q.trim() ? `Results for “${q.trim()}”` : cat === "All" ? "All time rank" : cat}</h2>
        <span className="shrink-0 text-sm text-white/50" aria-live="polite">{items.length} workflow{items.length === 1 ? "" : "s"}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-muted">
            {workflows.length === 0 ? "No workflows listed yet. Be the first to claim #1." : "No workflows match your search."}
          </p>
          {filtered && workflows.length > 0 ? (
            <button onClick={clear} className="btn-run mt-4 px-5 py-2 text-sm">Clear filters</button>
          ) : (
            <button onClick={openSubmit} className="btn-run mt-4 px-5 py-2 text-sm">Submit a workflow</button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map(({ w, rank }) => <GridCard key={w.id} w={w} rank={rank} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(({ w, rank }) => <ListRow key={w.id} w={w} rank={rank} />)}
        </div>
      )}
    </section>
  );
}
