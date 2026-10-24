"use client";
import { useState } from "react";
import { checkContact, MESSAGE_MAX } from "@/lib/contact";

const field =
  "w-full rounded-xl border border-border bg-black px-4 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-white aria-[invalid=true]:border-white";

type Key = "phone" | "email" | "message";

export default function ContactForm() {
  const [values, setValues] = useState({ phone: "", email: "", message: "" });
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  const check = checkContact(values);
  const errors = check.ok ? {} : check.errors;
  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));
  const blur = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }));
  const shown = (k: Key) => (touched[k] ? errors[k] : undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!check.ok || busy) { setTouched({ phone: true, email: true, message: true }); return; }
    setBusy(true); setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong, please try again");
      setSent(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center" role="status">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-white text-xl text-black">✓</div>
        <h2 className="text-2xl font-extrabold">Message sent</h2>
        <p className="mt-2 text-sm text-muted">Thanks for reaching out. We&apos;ll get back to you by email or phone soon.</p>
        <button onClick={() => { setValues({ phone: "", email: "", message: "" }); setTouched({}); setSent(false); }} className="btn-run mt-6 px-6 py-2.5 text-sm">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-border p-6 sm:p-8">
      <div>
        <label htmlFor="c-phone" className="mb-1.5 block text-sm font-semibold">Mobile number</label>
        <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" required className={field}
          value={values.phone} onChange={set("phone")} onBlur={blur("phone")} maxLength={20}
          placeholder="+91 98765 43210" aria-invalid={!!shown("phone")} aria-describedby="c-phone-err" />
        <p id="c-phone-err" className="mt-1.5 min-h-4 text-xs text-white">{shown("phone") && `! ${shown("phone")}`}</p>
      </div>

      <div>
        <label htmlFor="c-email" className="mb-1.5 block text-sm font-semibold">Email</label>
        <input id="c-email" type="email" inputMode="email" autoComplete="email" required className={field}
          value={values.email} onChange={set("email")} onBlur={blur("email")} maxLength={254}
          placeholder="you@gmail.com" aria-invalid={!!shown("email")} aria-describedby="c-email-err" />
        <p id="c-email-err" className="mt-1.5 min-h-4 text-xs text-white">{shown("email") && `! ${shown("email")}`}</p>
      </div>

      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-sm font-semibold">Message</label>
        <textarea id="c-message" required className={`${field} min-h-36 resize-y`}
          value={values.message} onChange={set("message")} onBlur={blur("message")} maxLength={MESSAGE_MAX}
          placeholder="How can we help?" aria-invalid={!!shown("message")} aria-describedby="c-message-err" />
        <div className="mt-1.5 flex justify-between gap-4 text-xs">
          <p id="c-message-err" className="min-h-4 text-white">{shown("message") && `! ${shown("message")}`}</p>
          <span className="shrink-0 text-white/40">{values.message.length}/{MESSAGE_MAX}</span>
        </div>
      </div>

      {/* Spam trap: hidden from people, bots fill it in */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
      </div>

      {serverError && <p role="alert" className="rounded-lg border border-white px-3 py-2 text-sm">{serverError}</p>}

      <div className="flex justify-end">
        <button disabled={busy} className="btn-run px-7 py-2.5 text-sm">{busy ? "Sending…" : "Send message"}</button>
      </div>
    </form>
  );
}
