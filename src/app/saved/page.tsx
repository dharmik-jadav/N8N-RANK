import { Suspense } from "react";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SavedList from "@/components/SavedList";
import SubmitModal from "@/components/SubmitModal";
import { CardsSkeleton } from "@/components/WorkflowCards";
import { getWorkflows } from "@/lib/data";

export const metadata: Metadata = { title: "Saved workflows – n8n Rank", robots: { index: false } };

async function Saved() {
  return <SavedList workflows={await getWorkflows()} />;
}

export default function SavedPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-14"><CardsSkeleton count={3} /></div>}>
          <Saved />
        </Suspense>
      </main>
      <SubmitModal />
      <Footer />
    </>
  );
}
