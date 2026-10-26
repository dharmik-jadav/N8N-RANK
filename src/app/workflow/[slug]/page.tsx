import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SubmitModal from "@/components/SubmitModal";
import ClickTracker from "@/components/ClickTracker";
import WorkflowActions from "@/components/WorkflowActions";
import WorkflowDiagram,{ parseWorkflow, prettyType } from "@/components/WorkflowDiagram";
import { getWorkflow } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const w = await getWorkflow((await params).slug);
  if (!w) return { title: "Workflow not found – n8n Rank" };
  const title = `${w.title} – n8n workflow | n8n Rank`;
  const description = w.description.slice(0, 160);
  // The share image comes from opengraph-image.tsx next to this file.
  return {
    title,
    description,
    openGraph: { title, description, type: "article", siteName: "n8n Rank" },
    twitter: { card: "summary_large_image", title, description },
  };
}

async function Details({ slug }: { slug: string }) {
  const w = await getWorkflow(slug);
  if (!w) notFound();

  const apps = [...new Set(parseWorkflow(w.graph).nodes.filter((n) => n.kind !== "sticky").map((n) => prettyType(n.type)))];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <ClickTracker workflowId={w.id} />
      <Link href="/#workflows" className="text-sm text-muted hover:text-white">← All workflows</Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="min-w-0">
          <p className="mb-3 w-fit rounded-full border border-border px-3 py-1 text-xs text-muted">{w.category}</p>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">{w.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
            {w.author && <span>by {w.author}</span>}
            <span>{w.nodes} nodes</span>
            <span>{w.clicks} clicks</span>
            <span>{w.age}</span>
            {w.bid > 0 && <span className="font-bold text-white">Top bid ${w.bid}</span>}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <WorkflowActions id={w.id} title={w.title} />
            {w.buyUrl && (
              <a href={w.buyUrl} target="_blank" rel="noopener noreferrer nofollow sponsored"
                className="btn-run px-6 py-3 text-sm font-bold">
                Buy this workflow <span aria-hidden>↗</span>
              </a>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          {w.imageUrl && (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border">
              <Image src={w.imageUrl} alt={`${w.title} preview`} fill sizes="(min-width: 1024px) 360px, 100vw" priority className="object-cover" />
            </div>
          )}
          <div>
            <h2 className="mb-3 text-sm font-bold">Nodes used</h2>
            <ul className="flex flex-wrap gap-2">
              {apps.map((a) => (
                <li key={a} className="rounded-full border border-border px-3 py-1 text-xs text-white/70">{a}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-8">
        <WorkflowDiagram json={w.graph} title={w.title} />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold">About this workflow</h2>
        <p className="whitespace-pre-line leading-relaxed text-white/80">{w.description}</p>
      </section>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12" aria-busy>
      <div className="skeleton h-4 w-28 rounded" />
      <div className="skeleton mt-8 h-12 w-2/3 rounded" />
      <div className="skeleton mt-3 h-4 w-1/3 rounded" />
      <div className="skeleton mt-8 h-96 rounded-2xl" />
    </div>
  );
}

export default function WorkflowPage({ params }: Props) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense fallback={<Skeleton />}>
          {params.then(({ slug }) => <Details slug={slug} />)}
        </Suspense>
      </main>
      <SubmitModal />
      <Footer />
    </>
  );
}
