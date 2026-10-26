"use client";
import { CATEGORIES } from "@/lib/categories";

/**
 * Category picker for phones: a native dropdown (the OS picker), so 30 categories are one tap away
 * instead of a long row to swipe. Wider screens use CategoryChips.
 */
export default function CategoryDropdown({ value, onChange, className = "" }: { value: string; onChange: (c: string) => void; className?: string }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">Category</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // 16px text: iOS Safari zooms the page in when a smaller field is focused
        className="h-11 w-full appearance-none rounded-full border border-white/35 bg-black pl-5 pr-11 text-base font-semibold outline-none focus:border-white"
      >
        <option value="All">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
