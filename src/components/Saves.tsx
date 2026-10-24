"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "./Toast";

type SavesCtx = { ids: Set<string>; loaded: boolean; toggle: (id: string) => void };
const Ctx = createContext<SavesCtx>({ ids: new Set(), loaded: false, toggle: () => {} });
export const useSaves = () => useContext(Ctx);

/** The visitor's saved workflows (no login: tied to a cookie). Optimistic, rolls back if the server fails. */
export default function SavesProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const idsRef = useRef(ids);

  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  useEffect(() => {
    fetch("/api/saves")
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((d: { ids: string[] }) => setIds(new Set(d.ids)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggle = useCallback(
    (id: string) => {
      const saved = !idsRef.current.has(id);
      const apply = (on: boolean) =>
        setIds((prev) => {
          const n = new Set(prev);
          if (on) n.add(id);
          else n.delete(id);
          return n;
        });
      apply(saved);
      toast(saved ? "Saved" : "Removed from saved");
      fetch("/api/saves", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workflowId: id, saved }),
      })
        .then((r) => {
          if (!r.ok) throw new Error();
        })
        .catch(() => {
          apply(!saved);
          toast("Could not save, try again");
        });
    },
    [toast],
  );

  const value = useMemo(() => ({ ids, loaded, toggle }), [ids, loaded, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function BookmarkButton({ id, className = "" }: { id: string; className?: string }) {
  const { ids, toggle } = useSaves();
  const on = ids.has(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save workflow"}
      title={on ? "Remove from saved" : "Save workflow"}
      className={`grid h-8 w-8 place-items-center rounded-full border border-border bg-black/70 backdrop-blur transition hover:border-white ${on ? "text-white" : "text-white/70"} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
