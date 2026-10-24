import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SubmitModal from "@/components/SubmitModal";
import { CardsSkeleton, ListRow } from "@/components/WorkflowCards";
import { getWorkflows } from "@/lib/data";
import { admin } from "@/lib/paypal";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Shared list – n8n Rank" };

/** A public, read-only list: whatever its owner currently has saved. */
async function List({ slug }: { slug: string }) {
  const db = admin();
  if (!db || !/^[0-9a-f]{6,32}$/i.test(slug)) notFound();

  const { data: col } = await db
    .from("collections")
    .select("name, owner_visitor_id")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!col) notFound();

  const { data: marks } = await db.from("bookmarks").select("workflow_id").eq("visitor_id", col.owner_visitor_id);
  const ids = new Set((marks ?? []).map((m) => m.workflow_id));
  const items = (await getWorkflows()).map((w, i) => ({ w, rank: i + 1 })).filter(({ w }) => ids.has(w.id));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
      <p className="text-sm text-muted">Shared list</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{col.name}</h1>
      <p className="mt-2 text-sm text-white/50">{items.length} workflow{items.length === 1 ? "" : "s"}</p>
      <div className="mt-8 flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-16 text-center text-muted">This list is empty right now.</p>
        ) : (
          items.map(({ w, rank }) => <ListRow key={w.id} w={w} rank={rank} />)
        )}
      </div>
      <Link href="/#workflows" className="btn-run mt-8 px-5 py-2.5 text-sm">Explore all workflows</Link>
    </div>
  );
}

export default function SharedListPage({ params }: Props) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-14"><CardsSkeleton count={3} /></div>}>
          {params.then(({ slug }) => <List slug={slug} />)}
        </Suspense>
      </main>
      <SubmitModal />
      <Footer />
    </>
  );
}
