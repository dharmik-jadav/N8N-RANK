import { cookies } from "next/headers";

const COOKIE = "vid";

/** Anonymous visitor id from the `vid` cookie (no auth). `create` sets it when missing; only allowed in route handlers. */
export async function getVisitorId(create = false): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  if (!create) return null;
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 * 2, path: "/" });
  return id;
}
