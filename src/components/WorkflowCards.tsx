"use client";
import Image from "next/image";
import Link from "next/link";
import type { Workflow } from "@/lib/data";
import { BookmarkButton } from "./Saves";
import { MiniFlow } from "./MiniFlow";

export const claimPrice = (bid: number) => Math.max(5, bid + 1);
const hash = (id: string) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100003, 7);

function ClaimBar({ rank, bid }: { rank: number; bid: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/40 opacity-0 transition duration-150 group-hover:opacity-100">
      <span className="scale-90 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-black transition duration-150 group-hover:scale-100">
        Claim #{rank} · ${claimPrice(bid)}
      </span>
    </span>
  );
}

/** Ranks 1-3 get their own look: a brighter border and glow (strongest for #1) and a big number. */
export const isTop = (rank: number) => rank <= 3;
const TIER = [
  "border-white shadow-[0_0_0_1px_#fff,0_0_32px_rgba(255,255,255,0.22)]",
  "border-white/70 shadow-[0_0_24px_rgba(255,255,255,0.12)]",
  "border-white/50 shadow-[0_0_18px_rgba(255,255,255,0.08)]",
];
const NUM_TONE = ["text-white", "text-white/80", "text-white/60"];
const tier = (rank: number) => (isTop(rank) ? TIER[rank - 1] : "border-border");

function Thumb({ w, rank, className, badge = "auto" }: { w: Workflow; rank: number; className: string; badge?: "auto" | "none" }) {
  return (
    <div className={`canvas-grid relative shrink-0 overflow-hidden border border-border bg-black ${className}`}>
      {w.imageUrl ? (
        <Image src={w.imageUrl} alt="" fill sizes="(min-width: 1024px) 200px, 120px" className="object-cover" />
      ) : (
        <MiniFlow seed={hash(w.id)} nodes={w.nodes} />
      )}
      {badge === "none" ? null : isTop(rank) ? (
        <span className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2.5 pb-1 pt-8 text-6xl font-black leading-none tracking-tighter ${NUM_TONE[rank - 1]}`}>
          {rank}
        </span>
      ) : (
        <span className="absolute left-1.5 top-1 z-[1] rounded bg-black/60 px-1 text-[10px] font-extrabold text-white/70">#{rank}</span>
      )}
    </div>
  );
}

/** Whole-card link sits under the content; the bookmark button sits above it so both stay valid HTML. */
const CardLink = ({ w }: { w: Workflow }) => (
  <Link href={`/workflow/${w.slug}`} prefetch={false} aria-label={w.title} className="absolute inset-0 z-20 rounded-[inherit]" />
);

export function GridCard({ w, rank }: { w: Workflow; rank: number }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-card p-2.5 transition hover:border-white ${tier(rank)}`}>
      <CardLink w={w} />
      <ClaimBar rank={rank} bid={w.bid} />
      <BookmarkButton id={w.id} className="absolute right-3.5 top-3.5 z-30 !h-7 !w-7" />
      <Thumb w={w} rank={rank} className="mb-2.5 aspect-square w-full rounded-lg" />
      <h3 className="truncate text-[13px] font-bold leading-tight">{w.title}</h3>
      <p className="mt-0.5 truncate text-[11px] text-muted">{w.category}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
        <span>{w.clicks} clicks</span>
        <span className="font-bold text-white">{w.bid > 0 ? `$${w.bid}` : "Open"}</span>
      </div>
    </div>
  );
}

export function ListRow({ w, rank }: { w: Workflow; rank: number }) {
  const top = isTop(rank);
  return (
    <div className={`group relative flex items-center overflow-hidden border bg-card transition hover:border-white ${top ? `gap-4 rounded-2xl p-5 sm:gap-5 ${tier(rank)}` : "gap-4 rounded-2xl p-4 border-border"}`}>
      <CardLink w={w} />
      <ClaimBar rank={rank} bid={w.bid} />
      {top && (
        <span aria-label={`Rank ${rank}`} className={`w-9 shrink-0 text-center text-6xl font-black leading-none tracking-tighter sm:w-14 sm:text-7xl ${NUM_TONE[rank - 1]}`}>
          {rank}
        </span>
      )}
      <Thumb w={w} rank={rank} badge={top ? "none" : "auto"} className={top ? "h-20 w-20 rounded-xl sm:h-24 sm:w-24" : "h-16 w-16 rounded-xl"} />
      <div className="min-w-0 flex-1">
        <h3 className={`truncate font-bold ${top ? "text-lg sm:text-xl" : ""}`}>{w.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{w.description}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
          <span>{w.category}</span><span>{w.clicks} clicks</span><span>{w.nodes} nodes</span><span>{w.age}</span>
        </div>
      </div>
      <span className={`shrink-0 font-extrabold ${top ? "text-2xl" : "text-lg"}`}>{w.bid > 0 ? `$${w.bid}` : "Open"}</span>
      <BookmarkButton id={w.id} className="z-30 shrink-0" />
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
