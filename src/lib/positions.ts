import type { SupabaseClient } from "@supabase/supabase-js";
import { FIRST_LISTING_CENTS, MAX_CLAIM_RANK, MIN_BID_CENTS, spotPriceCents } from "./pricing";

/** A paid spot someone can take: the workflow holding it now and what it costs to take it. */
export type Spot = { rank: number; title: string; currentCents: number; priceCents: number };
export type Positions = {
  spots: Spot[];
  /** The first spot below every paid one. Costs the minimum bid, or less for the very first listing on an empty board. */
  open: { rank: number; priceCents: number };
};

const MAX_SPOTS = MAX_CLAIM_RANK;
const PAGE = 1000; // rows per request
const MAX_ROWS = 20000; // safety stop

type Row = { title: string; click_count: number; created_at: string; bids: { amount_cents: number }[] };

/** Reads every published workflow, a page at a time, so a long list is never cut off. Throws if the database cannot be read. */
async function loadPublished(db: SupabaseClient): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await db
      .from("workflows")
      .select("title, click_count, created_at, bids(amount_cents)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + PAGE - 1);
    if (error || !data) throw new Error(`Could not read the leaderboard: ${error?.message ?? "no data"}`);
    rows.push(...(data as unknown as Row[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

/** Live price list, ranked the same way as the site: highest bid, then clicks, then newest. Server only. Throws if prices cannot be worked out. */
export async function getPositions(db: SupabaseClient): Promise<Positions> {
  const rows = await loadPublished(db);

  const paid = rows
    .map((r) => ({ title: r.title, clicks: r.click_count, created: r.created_at, bid: Math.max(0, ...r.bids.map((b) => b.amount_cents)) }))
    .filter((w) => w.bid > 0)
    .sort((a, b) => b.bid - a.bid || b.clicks - a.clicks || b.created.localeCompare(a.created));

  return {
    spots: paid.slice(0, MAX_SPOTS).map((w, i) => ({ rank: i + 1, title: w.title, currentCents: w.bid, priceCents: spotPriceCents(i + 1, w.bid) })),
    open: { rank: paid.length + 1, priceCents: rows.length === 0 ? FIRST_LISTING_CENTS : MIN_BID_CENTS },
  };
}

/** Price in cents of spot `rank` right now, or null if that spot is not for sale. */
export function priceForSpot(p: Positions, rank: number): number | null {
  if (p.open.rank === rank) return p.open.priceCents;
  return p.spots.find((s) => s.rank === rank)?.priceCents ?? null;
}
