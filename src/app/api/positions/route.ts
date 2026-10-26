import { admin } from "@/lib/paypal";
import { getPositions } from "@/lib/positions";
import { FIRST_LISTING_CENTS } from "@/lib/pricing";

/** Live prices for the "Where do you want to appear?" step in the submit form. */
export async function POST() {
  const db = admin();
  if (!db) return Response.json({ spots: [], open: { rank: 1, priceCents: FIRST_LISTING_CENTS } });
  try {
    return Response.json(await getPositions(db));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load prices" }, { status: 500 });
  }
}
