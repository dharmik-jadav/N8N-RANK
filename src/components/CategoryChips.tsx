"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

const Arrow = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={dir === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
  </svg>
);

const DRAG_THRESHOLD = 5; // px of mouse movement before a press counts as a drag instead of a click

/**
 * Category filter row. Phones swipe it. On desktop it can be dragged with the mouse, scrolled with the
 * wheel (vertical wheel moves it sideways until it reaches an end) or moved with the arrow buttons.
 */
export default function CategoryChips({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const row = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: true });
  const [grabbing, setGrabbing] = useState(false);
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 });

  const update = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    // Mouse wheel: turn vertical scrolling into sideways scrolling, but let the page scroll once the row is at an end.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // trackpad / horizontal wheel already works
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if ((e.deltaY > 0 && el.scrollLeft < max - 1) || (e.deltaY < 0 && el.scrollLeft > 1)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => { el.removeEventListener("scroll", update); el.removeEventListener("wheel", onWheel); ro.disconnect(); };
  }, [update]);

  // Mouse drag. Touch and pen already scroll natively, so only the mouse is handled here.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { down: true, moved: false, startX: e.clientX, startLeft: e.currentTarget.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    if (!d.moved) { d.moved = true; setGrabbing(true); e.currentTarget.setPointerCapture(e.pointerId); }
    e.currentTarget.scrollLeft = d.startLeft - dx;
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.down) return;
    drag.current.down = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setGrabbing(false);
  };
  // A drag that ends on a chip must not also select it.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; }
  };

  const scroll = (dir: -1 | 1) => {
    const el = row.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => scroll(-1)} disabled={!edge.left} aria-label="Scroll categories left"
        className="btn-run hidden h-9 w-9 shrink-0 md:inline-flex">
        <Arrow dir="left" />
      </button>

      <div
        ref={row} role="group" aria-label="Categories"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className={`no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto md:cursor-grab ${grabbing ? "select-none md:cursor-grabbing" : ""}`}
      >
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => onChange(c)} aria-pressed={value === c}
            className={`btn-run btn-chip shrink-0 px-3.5 py-1.5 text-sm ${value === c ? "is-active" : ""}`}>
            {c}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => scroll(1)} disabled={!edge.right} aria-label="Scroll categories right"
        className="btn-run hidden h-9 w-9 shrink-0 md:inline-flex">
        <Arrow dir="right" />
      </button>
    </div>
  );
}
