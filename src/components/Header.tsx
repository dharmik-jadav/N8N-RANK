"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { openSubmit } from "@/lib/submit";

const NAV = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Workflows", href: "/#workflows" },
  { label: "Saved", href: "/saved" },
];

const REVEAL_ZONE = 24; // px from the top edge where the pointer brings the header back

export default function Header() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let hovering = false;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) setHidden(false);
      else if (y > lastY + 4 && !hovering) setHidden(true); // scrolling down
      else if (y < lastY - 4) setHidden(false); // scrolling up
      lastY = y;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.clientY <= REVEAL_ZONE) setHidden(false);
    };
    const header = document.getElementById("site-header");
    const enter = () => { hovering = true; };
    const leave = () => { hovering = false; };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    header?.addEventListener("pointerenter", enter);
    header?.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
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
    <header
      id="site-header"
      className={`pointer-events-none sticky top-0 z-30 px-3 pt-3 transition-transform duration-300 ease-out sm:px-4 ${hidden ? "-translate-y-[calc(100%+1rem)]" : "translate-y-0"}`}
    >
      <div className="pointer-events-auto mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full border border-white/20 bg-[#1a1a1a]/80 pl-5 pr-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <Link href="/" aria-label="n8n rank home" className="flex items-center">
          <Image src="/logo.png" alt="n8n rank" width={889} height={192} priority className="h-7 w-auto" />
        </Link>
        <nav aria-label="Main" className="hidden items-center md:flex">
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
        <button onClick={openSubmit} className="btn-run shrink-0 px-4 py-2 text-sm">
          Submit workflow
        </button>
      </div>
    </header>
  );
}
