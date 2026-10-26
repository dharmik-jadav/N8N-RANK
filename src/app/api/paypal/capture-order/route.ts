import { cookies } from "next/headers";
import { admin, firstCapture, paypal, settle } from "@/lib/paypal";

const err = (error: string, status = 400) => Response.json({ error }, { status });

type Payment = { workflow_id: string; status: string; workflows: { slug: string; author_visitor_id: string } };

export async function POST(request: Request) {
  const db = admin();
  if (!db) return err("Supabase is not configured yet (see .env.example)", 503);

  const { orderId } = await request.json().catch(() => ({}));
  const visitorId = (await cookies()).get("vid")?.value;
  if (typeof orderId !== "string" || !/^[A-Za-z0-9]{8,40}$/.test(orderId) || !visitorId) return err("Missing order");

  // The order must be one we created, for a workflow this visitor submitted.
  const { data: pay } = await db.from("payments")
    .select("workflow_id, status, workflows!inner(slug, author_visitor_id)")
    .eq("paypal_order_id", orderId)
    .maybeSingle<Payment>();
  if (!pay || pay.workflows.author_visitor_id !== visitorId) return err("Order not found", 404);
  if (pay.status === "captured") return Response.json({ ok: true, slug: pay.workflows.slug });

  let res = await paypal(`/v2/checkout/orders/${orderId}/capture`, { method: "POST", body: {}, requestId: `capture-${orderId}` }).catch(() => null);
  if (res && !res.ok && JSON.stringify(res.data).includes("ORDER_ALREADY_CAPTURED")) {
    res = await paypal(`/v2/checkout/orders/${orderId}`).catch(() => null);
  }
  if (!res?.ok) return err("PayPal could not complete the payment. You have not been charged.", 402);

  const cap = firstCapture(res.data);
  // The buyer paid, but PayPal is holding the money (for example PENDING_REVIEW). Publish only once it is COMPLETED:
  // the buyer can check again, and the webhook publishes it automatically when PayPal releases it.
  // Sandbox testing only: PAYPAL_ACCEPT_PENDING=true treats a pending sandbox payment as paid. Ignored in live mode.
  const acceptPending = process.env.PAYPAL_ENV !== "live" && process.env.PAYPAL_ACCEPT_PENDING === "true";
  if (cap?.status === "PENDING" && !acceptPending) {
    return Response.json({ pending: true, reason: cap.status_details?.reason ?? null }, { status: 202 });
  }

  const result = await settle(db, orderId, pay.workflow_id, cap && acceptPending && cap.status === "PENDING" ? { ...cap, status: "COMPLETED" } : cap);
  // A temporary problem on our side: the buyer has paid, so ask them to check again (that call finishes the job) instead of showing an error.
  if (result === "retry") return Response.json({ pending: true, reason: "processing" }, { status: 202 });
  if (result !== "done") return err("Payment could not be verified. If you were charged, contact support with your PayPal receipt.", 402);

  return Response.json({ ok: true, slug: pay.workflows.slug });
}
