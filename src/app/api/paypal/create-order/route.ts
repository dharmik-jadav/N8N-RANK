import { cookies } from "next/headers";
import { admin, paypal } from "@/lib/paypal";
import { usd } from "@/lib/pricing";
import { getPositions, priceForSpot } from "@/lib/positions";

const err = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const db = admin();
  if (!db) return err("Supabase is not configured yet (see .env.example)", 503);

  const { workflowId, spot, expectedCents } = await request.json().catch(() => ({}));
  const visitorId = (await cookies()).get("vid")?.value;
  if (typeof workflowId !== "string" || !visitorId) return err("Missing workflow");

  const { data: wf } = await db.from("workflows").select("id, title")
    .eq("id", workflowId).eq("author_visitor_id", visitorId).eq("status", "awaiting_payment").maybeSingle();
  if (!wf) return err("This submission was not found or is already paid", 404);

  // Position price comes from live data on the server; the browser only says which spot it wants and what it was shown.
  // The position is the whole price (there is no separate listing fee), so one is required.
  if (!Number.isInteger(spot) || spot < 1) return err("Please choose where you want to appear.");
  const positions = await getPositions(db).catch(() => null);
  if (!positions) return err("Could not check the price right now. Please try again.", 503);
  const price = priceForSpot(positions, spot);
  if (price === null) return err("That position is no longer available. Please pick another.", 409);
  const bidCents = price;
  const rank: number = spot;
  const totalCents = bidCents;
  if (Number.isInteger(expectedCents) && expectedCents !== totalCents) {
    return err(`The price for that position just changed to $${usd(totalCents)}. Please check the total shown above and press PayPal again.`, 409);
  }

  const order = await paypal("/v2/checkout/orders", {
    method: "POST",
    body: {
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: wf.id,
        description: `n8n Rank spot #${rank}: ${wf.title}`.slice(0, 120),
        amount: { currency_code: "USD", value: usd(totalCents) },
      }],
    },
  }).catch(() => null);
  if (!order?.ok || typeof order.data.id !== "string") return err("Could not start the PayPal payment", 502);

  const saved = await db.from("payments").insert({
    workflow_id: wf.id,
    paypal_order_id: order.data.id,
    amount_cents: totalCents,
    bid_cents: bidCents,
    placement_rank: rank,
  });
  if (saved.error) return err("Could not start the payment", 500);

  return Response.json({ id: order.data.id });
}
