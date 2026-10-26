"use client";
import { useEffect, useState } from "react";

const SHOW_AFTER = 400; // px scrolled before the button can appear
const JITTER = 4; // ignore tiny scroll movements
const PHONE = 640; // px: below this width the button simply stays visible

/**
 * Desktop: slides in while scrolling down, slides away while scrolling up.
 * Phones: stays visible whenever you are past the first screen. Finger scrolling and the bouncing browser
 * toolbars make the direction unreliable there, and the button is most needed after a long scroll.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < SHOW_AFTER) setVisible(false);
      else if (window.innerWidth < PHONE) setVisible(true);
      else if (y > lastY + JITTER) setVisible(true); // scrolling down
      else if (y < lastY - JITTER) setVisible(false); // scrolling up
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  // The fixed positioning lives on a wrapper: .btn-run sets position: relative, which would override a "fixed" class on the button itself.
  return (
    <div
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 transition-[transform,opacity] duration-300 ease-out sm:bottom-6 sm:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={toTop}
        aria-label="Back to top"
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        className="btn-run h-12 w-12"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
