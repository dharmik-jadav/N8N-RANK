import type { Metadata } from "next";
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
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Contact us</h1>
          <p className="mt-4 text-lg text-white/75">
            Questions about listing a workflow, payments or rankings? Send us a message and we&apos;ll reply by email or phone.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </main>
      <SubmitModal />
      <Footer />
    </>
  );
}
