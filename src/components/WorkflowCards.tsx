"use client";
import Image from "next/image";
import Link from "next/link";
import type { Workflow } from "@/lib/data";
import { BookmarkButton } from "./Saves";
import { MiniFlow } from "./MiniFlow";
import { claimSpot, usd } from "@/lib/pricing";
import { openSubmit } from "@/lib/submit";

const hash = (id: string) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100003, 7);

type Claim = { rank: number; cents: number };
const claimFor = (w: Workflow, rank: number, openRank: number): Claim => claimSpot(Math.round(w.bid * 100), rank, openRank);
const claimLabel = (c: Claim) => `Claim #${c.rank} for $${usd(c.cents)}`;

function ClaimBar({ claim }: { claim: Claim }) {
  return (
    // z-30 sits above the whole-card link (z-20). Only the button takes clicks, and only while the card is hovered.
    <span className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/40 opacity-0 transition duration-150 group-hover:opacity-100 [@media(hover:none)]:hidden">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openSubmit(claim.rank); }}
        className="pointer-events-none scale-90 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black transition duration-150 hover:bg-white/85 group-hover:pointer-events-auto group-hover:scale-100"
      >
        {claimLabel(claim)}
      </button>
    </span>
  );
}

/** Touch screens cannot hover, so the claim button is always visible there (devices that can hover use the ClaimBar overlay). */
function ClaimChip({ claim, className = "" }: { claim: Claim; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openSubmit(claim.rank); }}
      className={`btn-run relative z-30 hidden px-3 py-1.5 text-[11px] [@media(hover:none)]:inline-flex ${className}`}
    >
      {claimLabel(claim)}
    </button>
  );
}

/** Ranks 1-3 get their own look: a brighter border and glow (strongest for #1) and a big number. */
export const isTop = (rank: number) => rank <= 3;
const TIER = [
  "border-white shadow-[0_0_0_1px_#fff,0_0_32px_rgba(255,255,255,0.22)]",
  "border-white/70 shadow-[0_0_24px_rgba(255,255,255,0.12)]",
  "border-white/50 shadow-[0_0_18px_rgba(255,255,255,0.08)]",
];
const NUM_TONE = ["text-white", "text-white/80", "text-white/60", "text-white/45"];
/** Index into the size arrays: #1, #2, #3, then one plain size for every rank after that. */
const step = (rank: number) => Math.min(rank, 4) - 1;
const tier = (rank: number) => (isTop(rank) ? TIER[rank - 1] : "border-border");

/** "#1": the # is drawn smaller and centred on the number so the number stays the focus. */
const RankNum = ({ rank }: { rank: number }) => (
  <span className="inline-flex items-center justify-center gap-[0.04em]">
    <span className="text-[0.5em] font-extrabold leading-none opacity-80">#</span>
    <span style={rank >= 10 ? { fontSize: "0.8em" } : undefined}>{rank}</span>
  </span>
);

/** Sizes step down from #1 to #3; every rank after that is the same plain size. */
const GRID_NUM = ["text-[2.25rem]", "text-[2rem]", "text-[1.75rem]", "text-[1.5rem]"]; // number over the image in grid view
const PHONE_NUM = ["text-3xl", "text-[1.65rem]", "text-2xl", "text-xl"]; // number over the image in list view on phones
const LIST_NUM = ["sm:text-7xl", "sm:text-[4rem]", "sm:text-[3.5rem]", "sm:text-[3rem]"]; // number beside the image in list view
const LIST_THUMB = ["sm:h-24 sm:w-24", "sm:h-[5.5rem] sm:w-[5.5rem]", "sm:h-20 sm:w-20", "sm:h-20 sm:w-20"];
const LIST_PAD = ["sm:p-5", "sm:p-[1.125rem]", "sm:p-4", "sm:p-4"];
const LIST_TITLE = ["sm:text-xl", "sm:text-lg", "sm:text-[1.0625rem]", "sm:text-[1.0625rem]"];

function Thumb({ w, rank, className, badge = "auto" }: { w: Workflow; rank: number; className: string; badge?: "auto" | "none" | "phone" }) {
  return (
    <div className={`canvas-grid relative shrink-0 overflow-hidden border border-border bg-black ${className}`}>
      {w.imageUrl ? (
        <Image src={w.imageUrl} alt="" fill sizes="(min-width: 1024px) 200px, 120px" className="object-cover" />
      ) : (
        <MiniFlow seed={hash(w.id)} nodes={w.nodes} />
      )}
      {badge === "none" ? null : (
        <span className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pb-1 pt-5 font-black leading-none tracking-tighter ${badge === "phone" ? `${PHONE_NUM[step(rank)]} sm:hidden` : GRID_NUM[step(rank)]} ${NUM_TONE[step(rank)]}`}>
          <RankNum rank={rank} />
        </span>
      )}
    </div>
  );
}

/** Whole-card link sits under the content; the bookmark button sits above it so both stay valid HTML. */
const CardLink = ({ w }: { w: Workflow }) => (
  <Link href={`/workflow/${w.slug}`} prefetch={false} aria-label={w.title} className="absolute inset-0 z-20 rounded-[inherit]" />
);

export function GridCard({ w, rank, openRank }: { w: Workflow; rank: number; openRank: number }) {
  const claim = claimFor(w, rank, openRank);
  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-card p-2.5 transition hover:border-white ${tier(rank)}`}>
      <CardLink w={w} />
      <ClaimBar claim={claim} />
      <BookmarkButton id={w.id} className="absolute right-3.5 top-3.5 z-30 !h-7 !w-7" />
      <Thumb w={w} rank={rank} className="mb-2.5 aspect-square w-full rounded-lg" />
      <h3 className="truncate text-[13px] font-bold leading-tight">{w.title}</h3>
      <p className="mt-0.5 truncate text-[11px] text-muted">{w.category}</p>
      <div className="mt-2 text-[11px] text-white/50">
        <span>{w.clicks} clicks</span>
      </div>
      <ClaimChip claim={claim} className="mt-2.5 w-full" />
    </div>
  );
}

export function ListRow({ w, rank, openRank }: { w: Workflow; rank: number; openRank: number }) {
  const i = step(rank);
  const claim = claimFor(w, rank, openRank);
  return (
    <div className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl border bg-card p-3 transition hover:border-white sm:items-center sm:gap-5 ${LIST_PAD[i]} ${tier(rank)}`}>
      <CardLink w={w} />
      <ClaimBar claim={claim} />
      <span aria-label={`Rank ${rank}`} className={`hidden w-[4.75rem] shrink-0 text-center font-black leading-none tracking-tighter sm:block ${LIST_NUM[i]} ${NUM_TONE[i]}`}>
        <RankNum rank={rank} />
      </span>
      <Thumb w={w} rank={rank} badge="phone" className={`h-[4.5rem] w-[4.5rem] rounded-xl ${LIST_THUMB[i]}`} />
      <div className="min-w-0 flex-1">
        <h3 className={`line-clamp-2 break-words font-bold leading-snug text-base sm:truncate ${LIST_TITLE[i]}`}>{w.title}</h3>
        <p className="mt-1 hidden truncate text-sm text-muted sm:block">{w.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/50 sm:mt-2 sm:gap-x-3">
          <span className="max-w-full truncate rounded-full border border-border px-2 py-0.5 text-[11px] text-white/70 sm:border-0 sm:p-0 sm:text-xs sm:text-white/50">{w.category}</span>
          <span>{w.clicks} clicks</span>
          <span>{w.nodes} nodes</span>
          <span className="hidden sm:inline">{w.age}</span>
        </div>
        <ClaimChip claim={claim} className="mt-2.5" />
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch sm:flex-row sm:items-center sm:justify-start sm:gap-3 sm:self-auto">
        <BookmarkButton id={w.id} className="z-30 shrink-0 sm:order-2" />
      </div>
    </div>
  );
}

export function CardsSkeleton({ view = "list", count = 6 }: { view?: "grid" | "list"; count?: number }) {
  return view === "grid" ? (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-border p-2.5">
          <div className="skeleton aspect-square w-full rounded-lg" />
          <div className="skeleton mt-3 h-3 w-4/5 rounded" />
          <div className="skeleton mt-2 h-2.5 w-3/5 rounded" />
        </div>
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-border p-4">
          <div className="skeleton h-16 w-16 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-full max-w-md rounded" />
            <div className="skeleton h-2.5 w-1/3 rounded" />
          </div>
          <div className="skeleton h-6 w-10 rounded" />
        </div>
      ))}
    </div>
  );
}
