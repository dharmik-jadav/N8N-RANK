"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { validateWorkflow } from "@/lib/validateWorkflow";
import { compressImage, OPEN_SUBMIT_EVENT } from "@/lib/submit";
import { checkBuyUrl, MAX_BUY_URL } from "@/lib/buyUrl";
import { LISTING_PRICE_USD } from "@/lib/pricing";
import PayPalCheckout from "./PayPalCheckout";
import WorkflowDiagram from "./WorkflowDiagram";

type Parsed = { name: string; raw: string; nodeCount: number; json: Record<string, unknown> };

const field =
  "w-full rounded-xl border border-border bg-black px-4 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-white";

export default function SubmitModal() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [draftId, setDraftId] = useState("");
  const [paying, setPaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [jsonError, setJsonError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [buyUrl, setBuyUrl] = useState("");
  const [buyTouched, setBuyTouched] = useState(false);
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_SUBMIT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SUBMIT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const reset = () => {
    setParsed(null); setJsonError(""); setTitle(""); setDescription(""); setCategory(""); setBuyUrl(""); setBuyTouched(false);
    setImage(null); setAgree(false); setSubmitError(""); setDone(false); setSlug(""); setDraftId(""); setPaying(false);
  };

  const readFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setParsed(null);
    if (!/\.json$/i.test(file.name) && file.type !== "application/json") {
      setJsonError("Invalid workflow JSON: please upload a .json file");
      return;
    }
    const raw = await file.text();
    const res = validateWorkflow(raw);
    if (!res.ok) { setJsonError(res.error); return; }
    setJsonError("");
    setParsed({ name: file.name, raw, nodeCount: res.nodeCount, json: res.json });
    const guess = typeof res.json.name === "string" ? res.json.name : "";
    setTitle((t) => t || guess);
  }, []);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setSubmitError("Main image must be an image file"); return; }
    try {
      const blob = await compressImage(file);
      setImage((old) => { if (old) URL.revokeObjectURL(old.url); return { blob, url: URL.createObjectURL(blob) }; });
      setSubmitError("");
    } catch {
      setSubmitError("Could not read that image, try another one");
    }
  };

  const buy = checkBuyUrl(buyUrl);
  const valid =
    !!parsed && title.trim().length >= 3 && description.trim().length >= 10 && !!category && !!image && agree && buy.ok;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !parsed || !image) return;
    setBusy(true); setSubmitError("");
    try {
      const fd = new FormData();
      fd.set("workflow", parsed.raw);
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("category", category);
      if (buy.ok) fd.set("buy_url", buy.url);
      fd.set("image", image.blob, "cover.webp");
      const res = await fetch("/api/workflows", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong, please try again");
      setDraftId(data.id); // saved as a hidden draft; it is published only after the payment succeeds
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !busy && !paying && setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="submit-title" className="relative my-8 w-full max-w-lg rounded-2xl border border-border bg-black p-6 sm:p-8">
        {(busy || paying) && (
          <div role="status" aria-live="polite" className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-black/85 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <svg className="h-9 w-9 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-bold">{paying ? "Confirming your payment…" : "Saving your workflow…"}</p>
              <p className="text-xs text-muted">Please don&apos;t close this window.</p>
            </div>
          </div>
        )}
        <button onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">✕</button>

        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-white text-xl text-black">✓</div>
            <h2 className="text-2xl font-extrabold">Your workflow is live</h2>
            <p className="mt-2 text-sm text-muted">It now appears in the list and grid views.</p>
            <div className="mt-6 flex justify-center gap-3">
              {slug && <a href={`/workflow/${slug}`} className="btn-run px-6 py-2.5 text-sm">View workflow</a>}
              <button onClick={() => { reset(); setOpen(false); }} className="btn-run px-6 py-2.5 text-sm">Done</button>
            </div>
          </div>
        ) : draftId ? (
          <div className="space-y-5">
            <div>
              <h2 id="submit-title" className="text-2xl font-extrabold tracking-tight">Pay ${LISTING_PRICE_USD} to publish</h2>
              <p className="mt-1 text-sm text-muted">
                Your workflow is saved. It goes live in the list and grid as soon as your payment is confirmed.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
              <span className="min-w-0 truncate pr-3 font-semibold">{title || "Your workflow"}</span>
              <span className="shrink-0 font-extrabold">${LISTING_PRICE_USD} USD</span>
            </div>
            <PayPalCheckout
              workflowId={draftId}
              onProcessing={setPaying}
              onError={setSubmitError}
              onPaid={(s) => { setSubmitError(""); setSlug(s); setDone(true); router.refresh(); }}
            />
            {submitError && <p role="alert" className="rounded-lg border border-white px-3 py-2 text-sm">{submitError}</p>}
            <button type="button" onClick={reset} className="text-xs text-muted underline hover:text-white">
              Start over with a different workflow
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <h2 id="submit-title" className="text-2xl font-extrabold tracking-tight">Submit a workflow</h2>
              <p className="mt-1 text-sm text-muted">Upload your exported n8n workflow JSON and tell people what it does.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Workflow JSON</label>
              <div
                role="button" tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]); }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-8 text-center transition ${dragging ? "border-white bg-white/10" : "border-white/30 hover:border-white"}`}
              >
                {parsed ? (
                  <>
                    <span className="text-sm font-bold">{parsed.name}</span>
                    <span className="text-xs text-muted">{parsed.nodeCount} nodes · valid · click to replace</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl" aria-hidden>↑</span>
                    <span className="text-sm font-bold">Drag and drop your workflow JSON here</span>
                    <span className="text-xs text-muted">or click to browse</span>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
              {parsed && (
                <div className="mt-3">
                  <WorkflowDiagram json={parsed.json} title={title || parsed.name} compact />
                  <p className="mt-1.5 text-xs text-muted">This is how your workflow will appear on its page.</p>
                </div>
              )}
              {jsonError && (
                <p role="alert" className="mt-2 flex gap-2 rounded-lg border border-white px-3 py-2 text-sm">
                  <span aria-hidden className="font-extrabold">!</span>{jsonError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="wf-title" className="mb-1.5 block text-sm font-semibold">Title</label>
              <input id="wf-title" className={field} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI lead qualifier with HubSpot" />
            </div>

            <div>
              <label htmlFor="wf-desc" className="mb-1.5 block text-sm font-semibold">Description</label>
              <textarea id="wf-desc" className={`${field} min-h-24 resize-y`} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} placeholder="What does it do, and what do you need to run it?" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Main image</label>
              <button type="button" onClick={() => imgRef.current?.click()}
                className="flex w-full items-center gap-4 rounded-xl border border-border p-3 text-left hover:border-white">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="Preview" className="h-14 w-24 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-14 w-24 place-items-center rounded-lg border border-dashed border-white/30 text-white/50">+</span>
                )}
                <span className="text-sm">
                  {image ? <>Image ready · {(image.blob.size / 1024).toFixed(0)} KB <span className="text-muted">(click to change)</span></> : <>Choose an image <span className="text-muted">(auto-compressed to WebP)</span></>}
                </span>
              </button>
              <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
            </div>

            <div>
              <label htmlFor="wf-cat" className="mb-1.5 block text-sm font-semibold">Category</label>
              <select id="wf-cat" className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="" disabled>Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="wf-buy" className="mb-1.5 block text-sm font-semibold">
                Buy link
              </label>
              <input id="wf-buy" type="url" inputMode="url" required className={field} value={buyUrl} maxLength={MAX_BUY_URL}
                onChange={(e) => setBuyUrl(e.target.value)} onBlur={() => setBuyTouched(true)} placeholder="https://yourstore.gumroad.com/l/workflow"
                aria-invalid={buyTouched && !buy.ok} aria-describedby="wf-buy-hint" />
              <p id="wf-buy-hint" className={`mt-1.5 text-xs ${buy.ok || !buyTouched ? "text-muted" : "text-white"}`}>
                {buy.ok || !buyTouched ?"Where people can buy this workflow, e.g. your Gumroad, Lemon Squeezy or store page. It powers the Buy button." : `! ${buy.error}`}
              </p>
            </div>

            <label className="flex items-start gap-2.5 text-sm text-muted">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-white" />
              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener" className="text-white underline underline-offset-2">Terms and Conditions</a>{" "}
                and have read the{" "}
                <a href="/privacy" target="_blank" rel="noopener" className="text-white underline underline-offset-2">Privacy Policy</a>.
              </span>
            </label>

            {submitError && <p role="alert" className="rounded-lg border border-white px-3 py-2 text-sm">{submitError}</p>}

            <div className="flex justify-end">
              <button disabled={!valid || busy} className="btn-run px-6 py-2.5 text-sm">
                {busy ? "Saving…" : `Continue to payment · $${LISTING_PRICE_USD}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
