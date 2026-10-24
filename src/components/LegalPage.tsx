import Link from "next/link";
import Footer from "./Footer";
import Header from "./Header";
import SubmitModal from "./SubmitModal";
import { LEGAL } from "@/lib/legal";

/** Shows a configured legal detail, or a visible reminder when it has not been filled in yet. */
export function Fill({ value, label }: { value: string; label: string }) {
  if (value) return <>{value}</>;
  return <mark className="rounded bg-white px-1 font-semibold text-black">[{label}: to be added]</mark>;
}

export function Contact() {
  return LEGAL.contactEmail ? (
    <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
  ) : (
    <Fill value="" label="contact email" />
  );
}

export default function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
          <Link href="/" className="text-sm text-muted hover:text-white">← Back to n8n Rank</Link>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-white/50">Effective {LEGAL.effectiveDate}</p>
          <p className="mt-6 text-lg leading-relaxed text-white/80">{intro}</p>
          <div className="mt-10 space-y-4 leading-relaxed text-white/75 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_li]:pl-1 [&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </main>
      <SubmitModal />
      <Footer />
    </>
  );
}
