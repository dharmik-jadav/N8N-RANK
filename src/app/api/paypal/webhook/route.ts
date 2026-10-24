import { admin, paypal, settle } from "@/lib/paypal";

/** Backup for when the buyer pays but closes the tab before the capture call finishes. */
export async function POST(request: Request) {
  const db = admin();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!db || !webhookId) return new Response("Not configured", { status: 503 });

  const raw = await request.text();
  let event: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const h = request.headers;
  const verify = await paypal("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      auth_algo: h.get("paypal-auth-algo"),
      cert_url: h.get("paypal-cert-url"),
      transmission_id: h.get("paypal-transmission-id"),
      transmission_sig: h.get("paypal-transmission-sig"),
      transmission_time: h.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    },
  }).catch(() => null);
  if (verify?.data.verification_status !== "SUCCESS") return new Response("Invalid signature", { status: 400 });

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const cap = event.resource ?? {};
    const orderId = cap.supplementary_data?.related_ids?.order_id;
    if (typeof orderId === "string" && typeof cap.custom_id === "string") await settle(db, orderId, cap.custom_id, cap);
  }
  return new Response("ok");
}
