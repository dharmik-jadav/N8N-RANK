"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { openSubmit } from "@/lib/submit";

const LINKS = [
  { label: "All workflows", href: "/#workflows" },
  { label: "Top ranked", href: "/#workflows" },
  { label: "Contact us", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

export default function Footer() {
  const footer = useRef<HTMLElement>(null);

  // The logo reveal is a scroll-driven CSS animation (see .footer-logo in globals.css), which the browser runs off the
  // main thread. Only browsers without animation-timeline fall back to this JS version: --p goes 0 -> 1 as the footer scrolls in.
  useEffect(() => {
    const el = footer.current;
    if (!el) return;
    if (CSS.supports("animation-timeline", "view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const { top, height } = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight - top) / height));
      el.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <footer ref={footer} className="site-footer border-t border-border">
      {/* Logo: slides out and fades in while you scroll */}
      <div className="relative overflow-hidden px-4 pb-4">
        <div className="footer-logo mx-auto max-w-7xl pt-8">
          {/* Hover the big logo to reveal the Submit workflow button (always shown on touch screens, which cannot hover) */}
          <div className="footer-logo-inner group relative">
            <Link href="/" aria-label="n8n rank home" className="block">
              <Image src="/logo.png" alt="n8n rank" width={889} height={192} className="h-auto w-full select-none" />
            </Link>
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition duration-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:bg-transparent [@media(hover:none)]:opacity-100">
              <button type="button" onClick={openSubmit} className="btn-run px-6 py-3 text-sm">
                Submit workflow
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bar border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white">{l.label}</Link>
            ))}
          </nav>

          <span>© 2026 n8n Rank. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
