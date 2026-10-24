"use client";
import { useState } from "react";
import Link from "next/link";
import type { Workflow } from "@/lib/data";
import { useSaves } from "./Saves";
import { useToast } from "./Toast";
import { CardsSkeleton, ListRow } from "./WorkflowCards";

/** The visitor's saved workflows, plus a button that turns them into a public link to share. */
export default function SavedList({ workflows }: { workflows: Workflow[] }) {
  const { ids, loaded } = useSaves();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const saved = workflows.map((w, i) => ({ w, rank: i + 1 })).filter(({ w }) => ids.has(w.id));

  const share = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/collection", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      const url = `${window.location.origin}/c/${data.slug}`;
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: data.name, url }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied!");
      }
    } catch {
      toast("Could not create the link, try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Saved workflows</h1>
          <p className="mt-2 text-sm text-muted">Kept on this device. Share your list with a link anyone can open.</p>
        </div>
        <button onClick={share} disabled={busy || saved.length === 0} className="btn-run px-5 py-2.5 text-sm">
          {busy ? "Creating link…" : "Share my list"}
        </button>
      </div>

      <div className="mt-8">
        {!loaded ? (
          <CardsSkeleton count={3} />
        ) : saved.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-muted">Nothing saved yet. Tap the bookmark on any workflow to keep it here.</p>
            <Link href="/#workflows" className="btn-run mt-4 px-5 py-2 text-sm">Browse workflows</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {saved.map(({ w, rank }) => <ListRow key={w.id} w={w} rank={rank} />)}
          </div>
        )}
      </div>
    </div>
  );
}
