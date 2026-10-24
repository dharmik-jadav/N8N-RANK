import { admin } from "@/lib/paypal";
import { getVisitorId } from "@/lib/visitor";

const err = (error: string, status = 400) => Response.json({ error }, { status });
const DEFAULT_NAME = "My saved workflows";

/**
 * Get (or create) this visitor's shareable list. The public page /c/<slug> shows
 * whatever they currently have saved. Optionally renames the list.
 */
export async function POST(request: Request) {
  const db = admin();
  if (!db) return err("Supabase is not configured yet", 503);
  const vid = (await getVisitorId(true))!;

  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";

  const found = await db.from("collections").select("share_slug, name").eq("owner_visitor_id", vid).maybeSingle();
  if (found.error) return err("Could not load your list", 500);

  if (found.data) {
    if (name && name !== found.data.name) {
      const upd = await db.from("collections").update({ name }).eq("owner_visitor_id", vid);
      if (upd.error) return err("Could not rename your list", 500);
      return Response.json({ slug: found.data.share_slug, name });
    }
    return Response.json({ slug: found.data.share_slug, name: found.data.name });
  }

  const created = await db
    .from("collections")
    .insert({ owner_visitor_id: vid, name: name || DEFAULT_NAME, is_public: true })
    .select("share_slug, name")
    .single();
  if (created.error) return err("Could not create your list", 500);
  return Response.json({ slug: created.data.share_slug, name: created.data.name });
}
