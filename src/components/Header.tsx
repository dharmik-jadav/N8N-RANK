"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { openSubmit } from "@/lib/submit";

const NAV = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Workflows", href: "/#workflows" },
  { label: "Saved", href: "/saved" },
  { label: "Contact us", href: "/contact" },
];

const REVEAL_ZONE = 24; // px from the top edge where a mouse pointer brings the header back
// The full chained nav needs about 930px. Below this width the nav lives in the slide-in menu instead.
// (Keep in sync with the `min-[960px]:` classes below.)
const FULL_NAV = 960;

export default function Header() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
    // Stop the page behind the menu from scrolling.
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    let lastY = window.scrollY;
    let hovering = false; // mouse pointer resting on the header

    const onScroll = () => {
      const y = window.scrollY;
      if (menuOpenRef.current) { lastY = y; return; }
      if (y < 80) setHidden(false);
      else if (y > lastY + 4 && !hovering) setHidden(true); // scrolling down
      else if (y < lastY - 4) setHidden(false); // scrolling up
      lastY = y;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.clientY <= REVEAL_ZONE) setHidden(false);
    };
    // Only a mouse "hovers". Touch fires pointerenter on every tap and may never fire pointerleave while scrolling,
    // which would leave the header stuck on screen on phones.
    const header = document.getElementById("site-header");
    const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") hovering = true; };
    const leave = () => { hovering = false; };
    const onResize = () => { if (window.innerWidth >= FULL_NAV) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    header?.addEventListener("pointerenter", enter);
    header?.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      header?.removeEventListener("pointerenter", enter);
      header?.removeEventListener("pointerleave", leave);
    };
  }, []);

  // Lets other sticky bars (e.g. the category filter) sit flush under the header.
  useEffect(() => {
    // pill height (3.5rem) + top gap (0.75rem) + breathing room below (0.5rem)
    document.documentElement.style.setProperty("--header-h", hidden ? "0px" : "4.75rem");
  }, [hidden]);

  return (
    <>
      <header
        id="site-header"
        className={`pointer-events-none sticky top-0 z-30 px-3 pt-3 transition-transform duration-300 ease-out sm:px-4 ${hidden ? "-translate-y-[calc(100%+1rem)]" : "translate-y-0"}`}
      >
        <div className="pointer-events-auto mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full border border-white/20 bg-[#1a1a1a]/80 pl-5 pr-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <Link href="/" aria-label="n8n rank home" className="flex items-center">
            <Image src="/logo.png" alt="n8n rank" width={889} height={192} priority className="h-7 w-auto" />
          </Link>

          {/* Wide screens: chained nav + Submit. .btn-run sets its own display, so show/hide lives on wrappers, not on the buttons. */}
          <nav aria-label="Main" className="hidden items-center min-[960px]:flex">
            {NAV.map((item, i) => (
              <span key={item.href} className="flex items-center">
                {i > 0 && (
                  <svg width="28" height="8" aria-hidden className="text-white/50">
                    <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" className="nav-edge" />
                  </svg>
                )}
                <Link href={item.href} className="btn-run px-3.5 py-1.5 text-[13px]">
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
          <span className="hidden shrink-0 min-[960px]:block">
            <button onClick={openSubmit} className="btn-run px-4 py-2 text-sm">
              Submit workflow
            </button>
          </span>

          {/* Phone / tablet: only the menu button. Submit workflow lives inside the menu. */}
          <span className="shrink-0 min-[960px]:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              className="btn-run h-10 w-10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </span>
        </div>
      </header>

      {/* Slide-in menu: opens from the right edge. It sits outside <header> because the header is transformed, which would
          trap a position:fixed child inside the pill. */}
      <div inert={!menuOpen} className={`fixed inset-0 z-50 min-[960px]:hidden ${menuOpen ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute right-0 top-0 flex h-full w-[min(86vw,22rem)] flex-col border-l border-white/20 bg-[#111] shadow-[-16px_0_48px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex h-[4.75rem] shrink-0 items-center justify-between border-b border-white/10 px-5">
            <Image src="/logo.png" alt="n8n rank" width={889} height={192} className="h-6 w-auto" />
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="btn-run h-10 w-10">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <nav aria-label="Menu" className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="btn-run !justify-between px-5 py-3.5 text-base">
                {item.label}
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            ))}
            <button onClick={() => { setMenuOpen(false); openSubmit(); }} className="btn-run mt-2 px-5 py-3.5 text-base">
              Submit workflow
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
}
