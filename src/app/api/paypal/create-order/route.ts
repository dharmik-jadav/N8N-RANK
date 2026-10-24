import { cookies } from "next/headers";
import { admin, paypal } from "@/lib/paypal";
import { LISTING_PRICE_USD } from "@/lib/pricing";

const err = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const db = admin();
  if (!db) return err("Supabase is not configured yet (see .env.example)", 503);

  const { workflowId } = await request.json().catch(() => ({}));
  const visitorId = (await cookies()).get("vid")?.value;
  if (typeof workflowId !== "string" || !visitorId) return err("Missing workflow");

  const { data: wf } = await db.from("workflows").select("id, title")
    .eq("id", workflowId).eq("author_visitor_id", visitorId).eq("status", "awaiting_payment").maybeSingle();
  if (!wf) return err("This submission was not found or is already paid", 404);

  const order = await paypal("/v2/checkout/orders", {
    method: "POST",
    body: {
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: wf.id,
        description: `n8n Rank listing: ${wf.title}`.slice(0, 120),
        amount: { currency_code: "USD", value: LISTING_PRICE_USD },
      }],
    },
  }).catch(() => null);
  if (!order?.ok || typeof order.data.id !== "string") return err("Could not start the PayPal payment", 502);

  const saved = await db.from("payments").insert({
    workflow_id: wf.id,
    paypal_order_id: order.data.id,
    amount_cents: Math.round(Number(LISTING_PRICE_USD) * 100),
  });
  if (saved.error) return err("Could not start the payment", 500);

  return Response.json({ id: order.data.id });
}
