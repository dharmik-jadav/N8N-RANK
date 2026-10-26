"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { validateWorkflow } from "@/lib/validateWorkflow";
import { compressImage, OPEN_SUBMIT_EVENT } from "@/lib/submit";
import { checkBuyUrl, MAX_BUY_URL } from "@/lib/buyUrl";
import PositionPicker from "./PositionPicker";
import { FIRST_LISTING_CENTS, usd } from "@/lib/pricing";
import { priceForSpot, type Positions } from "@/lib/positions";
import PayPalCheckout from "./PayPalCheckout";
import WorkflowDiagram from "./WorkflowDiagram";

type Parsed = { name: string; raw: string; nodeCount: number; json: Record<string, unknown> };

const TITLE_MIN = 3;
const DESC_MIN = 10;

const field =
  "w-full rounded-xl border border-border bg-black px-4 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-white";

export default function SubmitModal() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [draftId, setDraftId] = useState("");
  const [paying, setPaying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(""); // paid, but PayPal is still reviewing the payment
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Positions | null>(null);
  const [claimed, setClaimed] = useState(false); // opened from a card's "Claim #N" button, so the spot is already chosen
  const [spot, setSpot] = useState(0); // 0 = nothing picked yet: the cheapest open spot is used
  const [positionsError, setPositionsError] = useState(false);
  const [positionsTry, setPositionsTry] = useState(0);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [jsonError, setJsonError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const titleEdited = useRef(false); // true once the user typed their own title, so a new file does not overwrite it
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
    const onOpen = (e: Event) => {
      const spot = (e as CustomEvent<{ spot?: number }>).detail?.spot;
      const fromClaim = typeof spot === "number" && spot > 0;
      setClaimed(fromClaim); // "Claim #N" on a card: that spot is picked already. The Submit workflow buttons ask which spot.
      setSpot(fromClaim ? spot : 0);
      setOpen(true);
    };
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

  // Live prices for the position picker. Refreshed when the form opens and again at the payment step.
  useEffect(() => {
    if (!open || done) return;
    let dead = false;
    fetch("/api/positions", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (dead) return;
        if (Array.isArray(d?.spots)) { setPositions(d); setPositionsError(false); } else setPositionsError(true);
      })
      .catch(() => { if (!dead) setPositionsError(true); });
    return () => { dead = true; };
  }, [open, done, draftId, positionsTry]);

  const reset = () => {
    titleEdited.current = false; setParsed(null); setJsonError(""); setTitle(""); setDescription(""); setCategory(""); setBuyUrl(""); setBuyTouched(false);
    setImage(null); setAgree(false); setSubmitError(""); setDone(false); setSlug(""); setDraftId(""); setPaying(false); setPendingOrder(""); setSpot(0);
  };

  // Asks the server whether PayPal has released the payment yet; publishes the workflow once it has.
  const checkPayment = async () => {
    if (!pendingOrder || checking) return;
    setChecking(true); setSubmitError("");
    try {
      const res = await fetch("/api/paypal/capture-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: pendingOrder }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not check the payment, please try again");
      if (data.pending) { setSubmitError("PayPal is still reviewing your payment. Please check again in a few minutes."); return; }
      setPendingOrder(""); setSlug(data.slug); setDone(true); router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not check the payment");
    } finally {
      setChecking(false);
    }
  };

  // Deletes the unpaid draft on the server, then clears the form so another workflow can be uploaded.
  const removeDraft = async () => {
    if (!draftId || removing || paying) return;
    setRemoving(true); setSubmitError("");
    try {
      const res = await fetch("/api/workflows", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: draftId }) });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not remove the workflow, please try again");
      }
      reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not remove the workflow");
    } finally {
      setRemoving(false);
    }
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
    // The title follows the file (its n8n name, else the file name) until the user types their own.
    const fallback = guess || file.name.replace(/\.json$/i, "");
    setTitle((t) => (!titleEdited.current || !t.trim() ? fallback.slice(0, 120) : t));
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

  // There is no free "standard" option: a spot is always chosen. Until one is picked (or when the picked one is taken
  // meanwhile) it is the open spot, which is the cheapest.
  //
  // If the live prices cannot be loaded (and nothing was loaded before), the starting price of the first position is shown
  // instead of a dead end. The server works out the real price again when the payment starts and says so if it differs.
  const usingFallback = !claimed && !positions && positionsError;
  const shown: Positions | null = positions ?? (usingFallback ? { spots: [], open: { rank: 1, priceCents: FIRST_LISTING_CENTS } } : null);
  const spotRank = !shown ? 0 : priceForSpot(shown, spot) != null ? spot : shown.open.rank;
  const spotCents = shown ? priceForSpot(shown, spotRank) ?? 0 : 0;
  const chosenSpot = spotCents > 0 ? spotRank : 0;
  const retryPositions = () => { setPositionsError(false); setPositionsTry((n) => n + 1); };
  const totalCents = spotCents; // no separate listing fee: the spot price is the whole charge

  const buy = checkBuyUrl(buyUrl);
  const titleLen = title.trim().length;
  const descLen = description.trim().length;
  const valid = !!parsed && titleLen >= TITLE_MIN && descLen >= DESC_MIN && !!category && !!image && agree && buy.ok;
  // Why the button is still disabled, in plain words.
  const missing = [
    !parsed && "your workflow JSON",
    titleLen < TITLE_MIN && `a title (${TITLE_MIN - titleLen} more character${TITLE_MIN - titleLen === 1 ? "" : "s"})`,
    descLen < DESC_MIN && `a description (${DESC_MIN - descLen} more character${DESC_MIN - descLen === 1 ? "" : "s"})`,
    !category && "a category",
    !image && "a main image",
    !buy.ok && "a valid buy link",
    !agree && "your agreement to the Terms",
  ].filter(Boolean) as string[];

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
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !busy && !paying && !removing && !checking && setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="submit-title" className="relative my-8 w-full min-w-0 max-w-lg rounded-2xl border border-border bg-black p-6 sm:p-8">
        {(busy || paying || removing || checking) && (
          <div role="status" aria-live="polite" className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-black/85 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <svg className="h-9 w-9 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-bold">{paying || checking ? "Confirming your payment…" : removing ? "Removing your workflow…" : "Saving your workflow…"}</p>
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
              <h2 id="submit-title" className="text-2xl font-extrabold tracking-tight">Pay ${usd(totalCents)} to publish</h2>
              <p className="mt-1 text-sm text-muted">
                Your workflow is saved. It goes live in the list and grid as soon as your payment is confirmed.
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-border px-4 py-3 text-sm">
              <p className="truncate font-semibold">{title || "Your workflow"}</p>
              <div className="flex justify-between font-extrabold"><span>{chosenSpot === 1 ? "Top spot (#1)" : `Spot #${chosenSpot}`}</span><span>${usd(totalCents)} USD</span></div>
            </div>
            {pendingOrder ? (
              <div className="space-y-3 rounded-xl border border-white px-4 py-4 text-sm">
                <p className="font-bold">Payment received, we&apos;re finishing up</p>
                <p className="text-muted">
                  Your workflow goes live as soon as your payment is confirmed. PayPal sometimes holds a payment for a short review. Please don&apos;t pay again.
                </p>
                <button type="button" onClick={checkPayment} disabled={checking} className="btn-run w-full px-5 py-2.5 text-sm">
                  Check payment status
                </button>
              </div>
            ) : (
              <>
                <button type="button" onClick={removeDraft} disabled={removing || paying}
                  className="btn-run w-full px-5 py-2.5 text-sm">
                  ✕ Remove this workflow &amp; upload another
                </button>
                <PayPalCheckout
                  workflowId={draftId}
                  spot={chosenSpot}
                  expectedCents={totalCents}
                  onProcessing={setPaying}
                  onError={setSubmitError}
                  onPending={(id) => { setSubmitError(""); setPendingOrder(id); }}
                  onPaid={(s) => { setSubmitError(""); setSlug(s); setDone(true); router.refresh(); }}
                />
              </>
            )}
            {submitError && <p role="alert" className="rounded-lg border border-white px-3 py-2 text-sm">{submitError}</p>}
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
              <input id="wf-title" className={field} value={title} maxLength={120} onChange={(e) => { titleEdited.current = true; setTitle(e.target.value); }} placeholder="e.g. AI lead qualifier with HubSpot" />
              <p className={`mt-1.5 text-xs ${titleLen < TITLE_MIN ? "text-white" : "text-white/40"}`}>
                {titleLen < TITLE_MIN ? `At least ${TITLE_MIN} characters (${titleLen}/${TITLE_MIN})` : `${titleLen}/120`}
              </p>
            </div>

            <div>
              <label htmlFor="wf-desc" className="mb-1.5 block text-sm font-semibold">Description</label>
              <textarea id="wf-desc" className={`${field} min-h-24 resize-y`} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} placeholder="What does it do, and what do you need to run it?" />
              <p className={`mt-1.5 text-xs ${descLen < DESC_MIN ? "text-white" : "text-white/40"}`} aria-live="polite">
                {descLen < DESC_MIN ? `At least ${DESC_MIN} characters (${descLen}/${DESC_MIN})` : `${descLen}/2000`}
              </p>
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
                  {image ? <>Image ready · {(image.blob.size / 1024).toFixed(0)} KB <span className="text-muted">(click to change)</span></> : "Choose an image"}
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

            {claimed ? (
              /* Opened from a card's "Claim #N" button: the spot is already chosen, just show the price. */
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
                {positionsError ? (
                  <>
                    <span className="text-muted">Could not load prices.</span>
                    <button type="button" onClick={retryPositions} className="btn-run px-4 py-1.5 text-xs">Retry</button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0">
                      <span className="block font-semibold">{chosenSpot === 0 ? "Loading prices…" : chosenSpot === 1 ? "Top spot (#1)" : `Spot #${chosenSpot}`}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs text-muted">Total today</span>
                      <span className="block font-extrabold">${usd(totalCents)}</span>
                    </span>
                  </>
                )}
              </div>
            ) : (
              /* Opened from a Submit workflow button: ask where they want to rank. */
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Where do you want to rank?</label>
                <PositionPicker positions={shown} spot={chosenSpot} onChange={setSpot} error={positionsError && !usingFallback} onRetry={retryPositions} />
                {usingFallback && (
                  <p className="mt-2 text-xs text-muted">
                    Live prices could not be loaded, so the starting price is shown. We confirm the exact price before you pay.{" "}
                    <button type="button" onClick={retryPositions} className="text-white underline underline-offset-2">Try again</button>
                  </p>
                )}
                {(!positionsError || usingFallback) && chosenSpot > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Total today: <span className="font-bold text-white">${usd(totalCents)}</span> for spot #{chosenSpot}
                  </p>
                )}
              </div>
            )}

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

            {missing.length > 0 && (
              <p className="text-xs leading-relaxed text-white/60" aria-live="polite">
                To continue, add: {missing.join(", ")}.
              </p>
            )}

            <div className="flex justify-end">
              <button disabled={!valid || busy || chosenSpot === 0} className="btn-run px-6 py-2.5 text-sm">
                {busy ? "Saving…" : chosenSpot === 0 ? (positionsError ? "Prices unavailable" : "Loading prices…") : `Continue to payment · $${usd(totalCents)}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
