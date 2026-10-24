export const MAX_BUY_URL = 500;

/**
 * Checks the required "buy this workflow" link. Used on the client and again on the server.
 * Returns the normalised URL or an error message.
 */
export function checkBuyUrl(input: string): { ok: true; url: string } | { ok: false; error: string } {
  const value = input.trim();
  if (!value) return { ok: false, error: "Buy link is required" };
  if (value.length > MAX_BUY_URL) return { ok: false, error: `Buy link must be under ${MAX_BUY_URL} characters` };

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
  } catch {
    return { ok: false, error: "Buy link is not a valid URL" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "Buy link must start with https://" };
  if (!url.hostname.includes(".")) return { ok: false, error: "Buy link is not a valid URL" };
  return { ok: true, url: url.toString() };
}
