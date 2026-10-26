import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SubmitModal from "@/components/SubmitModal";
import { FIRST_LISTING_CENTS, MIN_BID_CENTS, usd } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "About us – n8n Rank",
  description: "n8n Rank is a leaderboard where creators list n8n workflows and automation builders discover them.",
};

const POINTS = [
  {
    title: "For creators",
    text: `List your n8n workflow by picking a leaderboard position, from US$${usd(MIN_BID_CENTS)} (the very first listing is US$${usd(FIRST_LISTING_CENTS)}), add your own buy link, and let builders find it. You keep selling on your own store, and you can outbid others for a higher position.`,
  },
  {
    title: "For builders",
    text: "Search and filter workflows by app or category, see exactly how each one is built in a diagram, and head to the creator's page when you find one you want.",
  },
  {
    title: "How ranking works",
    text: "Workflows are ranked by the highest bid first, then by clicks, then by newest. Every position is up for grabs, so a better rank is always one bid away.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">About us</h1>
          <p className="mt-5 text-lg leading-relaxed text-white/80">
            n8n Rank is a leaderboard for n8n workflows. Creators list the automations they have built, and automation builders
            find ready-made workflows without starting from scratch.
          </p>
          <p className="mt-4 leading-relaxed text-white/70">
            We built it because good workflows are hard to find. They&apos;re scattered across stores, forums and social posts, and
            creators have no simple way to get them seen. n8n Rank puts them in one place and lets the best ones rise.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {POINTS.map((p) => (
              <section key={p.title} className="rounded-2xl border border-border p-5">
                <h2 className="text-base font-bold">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/#workflows" className="btn-run px-7 py-3 text-sm">Browse workflows</Link>
            <Link href="/contact" className="btn-run px-7 py-3 text-sm">Contact us</Link>
          </div>
        </div>
      </main>
      <SubmitModal />
      <Footer />
    </>
  );
}
