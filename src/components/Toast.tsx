"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { id: number; text: string };
const Ctx = createContext<(text: string) => void>(() => {});

/** Small pop-up messages ("Copied!", "Saved"). Use: const toast = useToast(); toast("Copied!") */
export const useToast = () => useContext(Ctx);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);

  const push = useCallback((text: string) => {
    const id = ++next.current;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="toast-in rounded-full border border-white bg-black px-4 py-2 text-sm font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
