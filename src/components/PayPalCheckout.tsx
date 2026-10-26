"use client";
import { useEffect, useRef } from "react";

type Buttons = { render: (el: HTMLElement) => Promise<void>; close: () => Promise<void> };
declare global {
  interface Window { paypal?: { Buttons: (options: object) => Buttons } }
}

let sdk: Promise<void> | null = null;
const loadSdk = () =>
  (sdk ??= new Promise<void>((resolve, reject) => {
    if (window.paypal) return resolve();
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&disable-funding=credit,paylater`;
    s.onload = () => resolve();
    s.onerror = () => { sdk = null; reject(new Error("Could not load PayPal")); };
    document.head.appendChild(s);
  }));

const post = async (url: string, body: object) => {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {
    throw new Error("Could not reach the server. Check your connection and try again.");
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong, please try again");
  return data;
};

type Props = {
  workflowId: string;
  /** Spot the buyer chose (0 = standard listing) and the total they were shown, in cents. The server re-checks both. */
  spot: number;
  expectedCents: number;
  onProcessing: (on: boolean) => void;
  onPaid: (slug: string) => void;
  onPending: (orderId: string) => void;
  onError: (message: string) => void;
};

/** PayPal buttons. The price is decided on the server; this only starts and finishes the payment. */
export default function PayPalCheckout({ workflowId, spot, expectedCents, onProcessing, onPaid, onPending, onError }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef({ onProcessing, onPaid, onPending, onError });

  useEffect(() => {
    cb.current = { onProcessing, onPaid, onPending, onError };
  });

  useEffect(() => {
    let buttons: Buttons | undefined;
    let dead = false;
    loadSdk()
      .then(() => {
        if (dead || !box.current || !window.paypal) return;
        buttons = window.paypal.Buttons({
          style: { layout: "vertical", color: "white", shape: "pill", label: "pay", height: 48, tagline: false },
          createOrder: async () => (await post("/api/paypal/create-order", { workflowId, spot, expectedCents })).id,
          onApprove: async (data: { orderID: string }) => {
            cb.current.onProcessing(true);
            try {
              const out = await post("/api/paypal/capture-order", { orderId: data.orderID });
              if (out.pending) cb.current.onPending(data.orderID);
              else cb.current.onPaid(out.slug);
            } catch (e) {
              cb.current.onError(e instanceof Error ? e.message : "Payment failed");
            } finally {
              cb.current.onProcessing(false);
            }
          },
          onCancel: () => cb.current.onError("Payment cancelled. Your workflow is saved, pay when you're ready."),
          onError: (err: unknown) => {
            console.error("PayPal error:", err);
            const detail = err instanceof Error ? err.message.replace(/\s+/g, " ").slice(0, 140) : "";
            cb.current.onError(`PayPal ran into a problem. You have not been charged, please try again.${detail ? ` (${detail})` : ""}`);
          },
        });
        return buttons.render(box.current);
      })
      .catch((e) => cb.current.onError(e instanceof Error ? e.message : "Could not load PayPal"));
    return () => { dead = true; buttons?.close().catch(() => {}); };
  }, [workflowId, spot, expectedCents]);

  // color-scheme: light stops the dark page from putting a white box behind PayPal's iframe, so the buttons float on the modal.
  return <div ref={box} className="min-h-[120px]" style={{ colorScheme: "light" }} />;
}
