import { admin } from "@/lib/paypal";
import { getVisitorId } from "@/lib/visitor";

const UUID = /^[0-9a-f-]{36}$/i;
const err = (error: string, status = 400) => Response.json({ error }, { status });

/** Ids of the workflows this visitor has saved. */
export async function GET() {
  const vid = await getVisitorId();
  if (!vid) return Response.json({ ids: [] });
  const db = admin();
  if (!db) return Response.json({ ids: [] });
  const { data, error } = await db
    .from("bookmarks")
    .select("workflow_id")
    .eq("visitor_id", vid)
    .order("created_at", { ascending: false });
  if (error) return err("Could not load saved workflows", 500);
  return Response.json({ ids: data.map((r) => r.workflow_id) });
}

/** Save (saved: true) or unsave (saved: false) one workflow. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = String(body?.workflowId ?? "");
  if (!UUID.test(id) || typeof body?.saved !== "boolean") return err("Invalid request");

  const db = admin();
  if (!db) return err("Supabase is not configured yet", 503);
  const vid = (await getVisitorId(true))!;

  const { error } = body.saved
    ? await db
        .from("bookmarks")
        .upsert({ visitor_id: vid, workflow_id: id }, { onConflict: "visitor_id,workflow_id", ignoreDuplicates: true })
    : await db.from("bookmarks").delete().eq("visitor_id", vid).eq("workflow_id", id);
  if (error) return err("Could not update your saved list", 500);
  return Response.json({ ok: true });
}
