import { Suspense } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SubmitModal from "@/components/SubmitModal";
import WorkflowBrowser from "@/components/WorkflowBrowser";
import { CardsSkeleton } from "@/components/WorkflowCards";
import { getWorkflows } from "@/lib/data";

async function Workflows() {
  return <WorkflowBrowser workflows={await getWorkflows()} />;
}

function ListSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-20" aria-busy>
      <div className="space-y-3 border-b border-border py-3">
        <div className="skeleton h-10 w-full rounded-full" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-8 w-28 shrink-0 rounded-full" />)}
        </div>
      </div>
      <div className="mt-8">
        <CardsSkeleton />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Suspense fallback={<ListSkeleton />}>
          <Workflows />
        </Suspense>
      </main>
      <SubmitModal />
      <Footer />
    </>
  );
}
