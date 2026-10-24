import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "@/lib/categories";
import { validateWorkflow } from "@/lib/validateWorkflow";
import { checkBuyUrl } from "@/lib/buyUrl";
import { parseWorkflow, prettyType } from "@/components/WorkflowDiagram";

const MAX_IMAGE_BYTES = 512 * 1024;

const err = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return err("Supabase is not configured yet (see .env.example)", 503);

  const form = await request.formData();
  const raw = String(form.get("workflow") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const category = String(form.get("category") ?? "");
  const image = form.get("image");
  const buy = checkBuyUrl(String(form.get("buy_url") ?? ""));

  const check = validateWorkflow(raw);
  if (!check.ok) return err(check.error);
  if (!buy.ok) return err(buy.error);
  if (title.length < 3 || title.length > 120) return err("Title must be 3-120 characters");
  if (description.length < 10 || description.length > 2000) return err("Description must be 10-2000 characters");
  if (!(CATEGORIES as readonly string[]).includes(category)) return err("Please choose a valid category");
  if (!(image instanceof File) || image.type !== "image/webp") return err("Main image is required");
  if (image.size > MAX_IMAGE_BYTES) return err("Image is too large (max 512 KB)");

  // Anonymous owner id (no auth): one cookie per browser.
  const jar = await cookies();
  let visitorId = jar.get("vid")?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    jar.set("vid", visitorId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 * 2, path: "/" });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const id = crypto.randomUUID();
  const imagePath = `${id}.webp`;

  const up = await supabase.storage.from("workflow-images").upload(imagePath, image, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (up.error) return err("Image upload failed", 500);

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}-${id.slice(0, 6)}`;
  const { error } = await supabase.from("workflows").insert({
    id,
    slug,
    title,
    description,
    category,
    workflow_json: check.json,
    node_count: check.nodeCount,
    apps: [...new Set(parseWorkflow(check.json).nodes.filter((n) => n.kind !== "sticky").map((n) => prettyType(n.type)))],
    image_path: imagePath,
    buy_url: buy.url,
    author_visitor_id: visitorId,
    status: "awaiting_payment", // becomes "published" only after PayPal confirms the payment
  });
  if (error) {
    await supabase.storage.from("workflow-images").remove([imagePath]);
    return err("Could not save the workflow", 500);
  }

  return Response.json({ ok: true, id, slug });
}
