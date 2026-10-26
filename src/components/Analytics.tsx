"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Script from "next/script";

// Set NEXT_PUBLIC_GA_ID (e.g. G-XXXXXXXXXX) to turn analytics on. There is no default, so a copy of this project never reports to someone else's property.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const KEY = "n8nrank-analytics-consent";
const OPEN_EVENT = "open-cookie-settings";

type Choice = "granted" | "denied" | "unset";

const enabled = process.env.NODE_ENV === "production" && /^G-[A-Z0-9]+$/.test(GA_ID);

const readChoice = (): Choice => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : "unset";
  } catch {
    return "unset";
  }
};

// The saved choice lives in localStorage, which React does not know about, so it is read as an external store.
const CHANGED_EVENT = "analytics-consent-changed";
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGED_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGED_EVENT, notify);
  };
};

/** Removes Google Analytics cookies and stops it from collecting for the rest of this page view. */
function switchOff() {
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true;
  for (const name of document.cookie.split(";").map((c) => c.split("=")[0].trim())) {
    if (name === "_ga" || name.startsWith("_ga_")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${location.hostname.replace(/^www\./, "")}`;
    }
  }
}

/** Google Analytics 4, loaded only after the visitor accepts. Production only, so local development does not pollute the statistics. */
export default function Analytics() {
  // "unknown" on the server and during hydration, so the page never flashes a banner for someone who already chose.
  const choice = useSyncExternalStore<Choice | "unknown">(subscribe, readChoice, () => "unknown");
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  if (!enabled || choice === "unknown") return null;
  const asking = choice === "unset" || reopened;

  const pick = (c: "granted" | "denied") => {
    try { localStorage.setItem(KEY, c); } catch { /* private mode: the choice just lasts until the page closes */ }
    if (c === "denied") switchOff();
    setReopened(false);
    window.dispatchEvent(new Event(CHANGED_EVENT));
  };

  return (
    <>
      {choice === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}

      {asking && (
        <div role="dialog" aria-label="Analytics cookies" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-white/25 bg-black/95 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.8)] backdrop-blur sm:left-4 sm:right-auto sm:mx-0">
          <p className="text-sm font-bold">Analytics cookies</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Can we use Google Analytics to count visits and see which pages are useful? Nothing is collected unless you accept.{" "}
            <a href="/privacy#cookies" className="text-white underline underline-offset-2">Privacy Policy</a>
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => pick("granted")} className="btn-run flex-1 px-4 py-2 text-xs">Accept</button>
            <button type="button" onClick={() => pick("denied")} className="btn-run flex-1 px-4 py-2 text-xs">Decline</button>
          </div>
        </div>
      )}
    </>
  );
}

/** "Cookie settings" button: lets visitors change their mind later. Shows nothing when analytics is off. */
export function CookieSettingsButton() {
  if (!enabled) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} className="underline underline-offset-2 hover:text-white">
      Change your cookie choice
    </button>
  );
}
