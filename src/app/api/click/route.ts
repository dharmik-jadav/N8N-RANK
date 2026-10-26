import { admin } from "@/lib/paypal";
import { getVisitorId } from "@/lib/visitor";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Counts one view of a workflow's page, at most once per visitor (see register_click in the database).
 * The author's own views and workflows that are not published do not count.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = String(body?.workflowId ?? "");
  if (!UUID.test(id)) return Response.json({ error: "Invalid request" }, { status: 400 });

  const db = admin();
  if (!db) return Response.json({ ok: true });
  const vid = (await getVisitorId(true))!;

  const { data: wf } = await db.from("workflows").select("author_visitor_id").eq("id", id).eq("status", "published").maybeSingle();
  if (!wf || wf.author_visitor_id === vid) return Response.json({ ok: true });

  const { error } = await db.rpc("register_click", { p_workflow: id, p_visitor: vid });
  if (error) console.error("register_click failed:", error.message);
  return Response.json({ ok: true });
}
