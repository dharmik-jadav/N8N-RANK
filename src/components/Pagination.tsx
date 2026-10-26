"use client";

/** 1 … 4 5 6 … 12: always the first and last page, the current page and one neighbour each side. */
function pageList(page: number, count: number): (number | "…")[] {
  const keep = new Set([1, count, page - 1, page, page + 1]);
  const pages = [...keep].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  pages.forEach((n, i) => {
    if (i > 0 && n - pages[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

type Props = { page: number; pageCount: number; total: number; pageSize: number; onChange: (page: number) => void };

export default function Pagination({ page, pageCount, total, pageSize, onChange }: Props) {
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-col items-center gap-3">
      <p className="text-xs text-white/50" aria-live="polite">Showing {from}–{to} of {total} workflows</p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page"
          className="btn-run btn-chip px-3.5 py-1.5 text-sm">
          ← <span className="hidden sm:inline">Previous</span>
        </button>

        {pageList(page, pageCount).map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} aria-hidden className="px-1 text-white/40">…</span>
          ) : (
            <button key={n} type="button" onClick={() => onChange(n)} aria-label={`Page ${n}`} aria-current={n === page ? "page" : undefined}
              className={`btn-run btn-chip min-w-9 px-3 py-1.5 text-sm ${n === page ? "is-active" : ""}`}>
              {n}
            </button>
          ),
        )}

        <button type="button" onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="Next page"
          className="btn-run btn-chip px-3.5 py-1.5 text-sm">
          <span className="hidden sm:inline">Next</span> →
        </button>
      </div>
    </nav>
  );
}
