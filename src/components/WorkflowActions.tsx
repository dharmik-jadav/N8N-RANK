"use client";
import { useSaves } from "./Saves";
import { useToast } from "./Toast";

/** Save + share buttons for the workflow details page. */
export default function WorkflowActions({ id, title }: { id: string; title: string }) {
  const { ids, toggle } = useSaves();
  const toast = useToast();
  const saved = ids.has(id);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied!");
    } catch {
      toast("Could not copy, copy the address bar instead");
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => toggle(id)} aria-pressed={saved} className="btn-run gap-2 px-4 py-2.5 text-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>
      <button onClick={share} className="btn-run gap-2 px-4 py-2.5 text-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
        </svg>
        Share
      </button>
    </div>
  );
}
