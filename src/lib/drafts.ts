import { admin, paypal } from "./paypal";

type Db = NonNullable<ReturnType<typeof admin>>;
type Draft = { id: string; image_path: string | null };

/** Unpaid drafts older than this are deleted the next time anyone submits. */
const DRAFT_TTL_HOURS = 24;
/** A visitor may keep this many unpaid drafts. Submitting another replaces their oldest one. */
export const MAX_UNPAID_PER_VISITOR = 3;
/** Backstop against floods from many fresh browsers: unpaid drafts created site-wide in the last hour. */
const MAX_UNPAID_PER_HOUR = 120;

/**
 * True when a buyer may already have paid for this draft: one of its PayPal orders is approved or completed (it could
 * be captured, or sit in "pending review", at any moment). Such a draft must never be deleted, or the payment would
 * have nothing to attach to. Orders that were only opened and abandoned (CREATED) do not count.
 */
export async function hasLivePayment(db: Db, workflowId: string): Promise<boolean> {
  const { data } = await db.from("payments").select("paypal_order_id").eq("workflow_id", workflowId).limit(10);
  for (const p of data ?? []) {
    const res = await paypal(`/v2/checkout/orders/${p.paypal_order_id}`).catch(() => null);
    // If PayPal cannot be reached, assume the worst and keep the draft.
    if (!res?.ok || res.data.status === "APPROVED" || res.data.status === "COMPLETED") return true;
  }
  return false;
}

/** Deletes the given unpaid drafts and their images, skipping any that may have a payment. Returns how many were deleted. */
async function removeDrafts(db: Db, drafts: Draft[]): Promise<number> {
  const removable: Draft[] = [];
  for (const d of drafts) if (!(await hasLivePayment(db, d.id))) removable.push(d);
  if (!removable.length) return 0;

  const del = await db.from("workflows").delete()
    .in("id", removable.map((d) => d.id)).eq("status", "awaiting_payment")
    .select("image_path");
  if (del.error) return 0;
  const images = (del.data ?? []).map((r) => r.image_path as string | null).filter((p): p is string => !!p);
  if (images.length) await db.storage.from("workflow-images").remove(images);
  return del.data?.length ?? 0;
}

/** Housekeeping that replaces a scheduled job: drops abandoned drafts (older than 24 hours). */
export async function purgeStaleDrafts(db: Db): Promise<void> {
  const cutoff = new Date(Date.now() - DRAFT_TTL_HOURS * 3600_000).toISOString();
  const { data } = await db.from("workflows").select("id, image_path")
    .eq("status", "awaiting_payment").lt("created_at", cutoff).limit(50);
  await removeDrafts(db, (data ?? []) as Draft[]);
}

/** Site-wide flood check. Returns a message when new submissions should be refused for now. */
export async function checkSiteLoad(db: Db): Promise<string | null> {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("workflows").select("id", { count: "exact", head: true })
    .eq("status", "awaiting_payment").gte("created_at", since);
  return (count ?? 0) >= MAX_UNPAID_PER_HOUR ? "We are receiving too many submissions right now. Please try again in a little while." : null;
}

/**
 * Makes room for one more draft: while the visitor already has MAX_UNPAID_PER_VISITOR unpaid drafts, the oldest is
 * removed. Returns how many unpaid drafts they still have (they can stay at the limit only if payments are in progress).
 */
export async function makeRoomForDraft(db: Db, visitorId: string): Promise<number> {
  const { data } = await db.from("workflows").select("id, image_path")
    .eq("status", "awaiting_payment").eq("author_visitor_id", visitorId)
    .order("created_at", { ascending: true }).limit(50);
  const drafts = (data ?? []) as Draft[];
  const excess = drafts.length - (MAX_UNPAID_PER_VISITOR - 1);
  if (excess <= 0) return drafts.length;
  const removed = await removeDrafts(db, drafts.slice(0, excess));
  return drafts.length - removed;
}
