import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { usd } from "./pricing";

const API = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export type Capture = {
  status?: string;
  status_details?: { reason?: string };
  custom_id?: string;
  amount?: { value?: string; currency_code?: string };
};

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Service-role client. Server only. */
export function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

async function accessToken(): Promise<string> {
  const id = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal is not configured");
  const res = await fetch(`${API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error("PayPal login failed");
  return data.access_token;
}

/** Calls the PayPal REST API. Returns the HTTP status and parsed body (does not throw on a PayPal error response). */
export async function paypal(path: string, init: { method?: string; body?: unknown; requestId?: string } = {}) {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as Json;
  return { ok: res.ok, status: res.status, data };
}

/** First capture of an order response, with the purchase unit's custom_id as a fallback. */
export function firstCapture(order: Json): Capture | undefined {
  const unit = order.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  return cap ? { ...cap, custom_id: cap.custom_id ?? unit?.custom_id } : undefined;
}

/** Records the bid that was paid for, in the current auction round. Safe to repeat (one row per PayPal order). Returns false if it could not be saved. */
async function recordBid(db: NonNullable<ReturnType<typeof admin>>, workflowId: string, orderId: string, bidCents: number, rank: number | null) {
  if (bidCents <= 0) return true;
  let round = (await db.from("auction_rounds").select("id").gt("ends_at", new Date().toISOString()).order("id", { ascending: false }).limit(1).maybeSingle()).data?.id;
  if (!round) round = (await db.from("auction_rounds").insert({}).select("id").single()).data?.id;
  if (!round) return false;
  const { error } = await db.from("bids").upsert(
    { round_id: round, slot: Math.min(Math.max(rank ?? 1, 1), 3), workflow_id: workflowId, amount_cents: bidCents, paypal_order_id: orderId, payment_status: "captured" },
    { onConflict: "paypal_order_id", ignoreDuplicates: true },
  );
  if (error) console.error("recording bid failed:", error.message);
  return !error;
}

/** "done": published. "ignored": not ours or not paid correctly, retrying will not help. "retry": a temporary problem on our side, try again. */
export type Settled = "done" | "ignored" | "retry";

/**
 * Publishes the workflow once PayPal confirms the right amount was captured for it, and records the bid that was paid for.
 * The expected amount is the one stored when we created the order. Safe to call more than once
 * (the capture route and the webhook both use it). The bid is saved first, so a failure leaves nothing half done and a retry starts clean.
 */
export async function settle(db: NonNullable<ReturnType<typeof admin>>, orderId: string, workflowId: string, cap?: Capture): Promise<Settled> {
  const { data: pay, error: payError } = await db.from("payments")
    .select("amount_cents, bid_cents, placement_rank")
    .eq("paypal_order_id", orderId).eq("workflow_id", workflowId).maybeSingle();
  if (payError) return "retry";
  if (!pay) return "ignored"; // not an order we created for this workflow

  if (
    cap?.status !== "COMPLETED" ||
    cap.amount?.currency_code !== "USD" ||
    cap.amount.value !== usd(pay.amount_cents) ||
    cap.custom_id !== workflowId
  ) return "ignored";

  if (!(await recordBid(db, workflowId, orderId, pay.bid_cents, pay.placement_rank))) return "retry";

  const paid = await db.from("payments").update({ status: "captured" })
    .eq("paypal_order_id", orderId).eq("workflow_id", workflowId).select("id");
  if (paid.error) return "retry";
  if (!paid.data?.length) return "ignored";

  const pub = await db.from("workflows").update({ status: "published" })
    .eq("id", workflowId).in("status", ["awaiting_payment", "published"]);
  if (pub.error) return "retry";

  revalidateTag("workflows", { expire: 0 });
  return "done";
}
