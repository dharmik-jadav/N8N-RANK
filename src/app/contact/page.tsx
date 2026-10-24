import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SubmitModal from "@/components/SubmitModal";

export const metadata: Metadata = {
  title: "Contact us – n8n Rank",
  description: "Questions about listing a workflow, payments or rankings? Send us a message.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
          <Link href="/" className="text-sm text-muted hover:text-white">← Back to n8n Rank</Link>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">Contact us</h1>
          <p className="mt-4 text-lg text-white/75">
            Questions about listing a workflow, payments or rankings? Send us a message and we&apos;ll reply by email or phone.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
          <p className="mt-6 text-xs text-white/50">
            We only use your details to reply to you. See our <Link href="/privacy" className="underline underline-offset-2 hover:text-white">Privacy Policy</Link>.
          </p>
        </div>
      </main>
      <SubmitModal />
      <Footer />
    </>
  );
}
