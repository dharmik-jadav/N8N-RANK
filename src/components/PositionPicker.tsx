"use client";
import { usd } from "@/lib/pricing";
import type { Positions } from "@/lib/positions";

type Option = { rank: number; heading: string; note: string; price: number; now?: number };

/**
 * "Where do you want to rank?" One row per leaderboard spot that can be bought: the paid spots, then the open spot below them.
 * A spot is always chosen (there is no free option).
 */
export default function PositionPicker({ positions, spot, onChange, error, onRetry }: {
  positions: Positions | null;
  spot: number;
  onChange: (spot: number) => void;
  error?: boolean;
  onRetry?: () => void;
}) {
  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
        <span className="text-muted">Could not load prices.</span>
        {onRetry && <button type="button" onClick={onRetry} className="btn-run px-4 py-1.5 text-xs">Retry</button>}
      </div>
    );
  }
  if (!positions) {
    return <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted" aria-busy>Loading prices…</div>;
  }

  const options: Option[] = positions.spots.map((s) => ({
    rank: s.rank,
    heading: s.title,
    note: s.rank === 1 ? "Top of the leaderboard. This workflow moves down one." : `Takes spot #${s.rank}. This workflow moves down one.`,
    price: s.priceCents,
    now: s.currentCents,
  }));
  options.push({
    rank: positions.open.rank,
    heading: "Open spot",
    note: "Minimum bid. Ranks above unpaid listings.",
    price: positions.open.priceCents,
  });

  return (
    <div role="radiogroup" aria-label="Where do you want to rank?" className="max-h-[26rem] space-y-2 overflow-y-auto pb-0.5 pr-1">
      {options.map((o) => (
        <label key={o.rank}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3.5 py-3 transition hover:border-white/70 has-[:checked]:border-white has-[:checked]:bg-white/5">
          <input type="radio" name="position" checked={spot === o.rank} onChange={() => onChange(o.rank)} className="h-4 w-4 shrink-0 accent-white" />
          <span aria-hidden className="w-12 shrink-0 text-center text-3xl font-black leading-none tracking-tighter">#{o.rank}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{o.heading}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">{o.note}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm font-extrabold">${usd(o.price)}</span>
            {o.now !== undefined && <span className="block text-[11px] text-muted">now ${usd(o.now)}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
