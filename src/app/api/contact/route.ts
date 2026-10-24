import { admin } from "@/lib/paypal";
import { checkContact } from "@/lib/contact";

const err = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return err("Invalid request");

  // Hidden field that real visitors never fill in; bots do. Pretend it worked.
  if (typeof body.website === "string" && body.website) return Response.json({ ok: true });

  const check = checkContact({
    phone: String(body.phone ?? ""),
    email: String(body.email ?? ""),
    message: String(body.message ?? ""),
  });
  if (!check.ok) return err(Object.values(check.errors)[0] ?? "Please check the form");

  const db = admin();
  if (!db) return err("Contact form is not set up yet", 503);

  const { error } = await db.from("contact_messages").insert(check.value);
  if (error) {
    // The database trigger rejects floods from one email address.
    if (error.message.includes("Too many messages")) return err("You have sent several messages already. Please wait a while and try again.", 429);
    console.error("contact insert failed:", error.message);
    return err("Could not send your message, please try again", 500);
  }

  return Response.json({ ok: true });
}
