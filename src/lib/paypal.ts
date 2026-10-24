import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { LISTING_PRICE_USD } from "./pricing";

const API = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export type Capture = {
  status?: string;
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

/**
 * Publishes the workflow once PayPal confirms the right amount was captured for it.
 * Safe to call more than once (the capture route and the webhook both use it).
 */
export async function settle(db: NonNullable<ReturnType<typeof admin>>, orderId: string, workflowId: string, cap?: Capture) {
  if (
    cap?.status !== "COMPLETED" ||
    cap.amount?.currency_code !== "USD" ||
    cap.amount.value !== LISTING_PRICE_USD ||
    cap.custom_id !== workflowId
  ) return false;

  const paid = await db.from("payments").update({ status: "captured" })
    .eq("paypal_order_id", orderId).eq("workflow_id", workflowId).select("id");
  if (paid.error || !paid.data?.length) return false; // not an order we created for this workflow

  const pub = await db.from("workflows").update({ status: "published" })
    .eq("id", workflowId).eq("status", "awaiting_payment");
  if (pub.error) return false;

  revalidateTag("workflows", { expire: 0 });
  return true;
}
