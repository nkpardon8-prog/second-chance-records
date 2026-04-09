"use client";

import { useState } from "react";
import Link from "next/link";
import MobileMenu from "./MobileMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Events" },
  { href: "/mission", label: "Mission" },
  { href: "/visit", label: "Visit" },
  { href: "/contact", label: "Contact" },
  { href: "/reviews", label: "Reviews" },
  { href: "/community", label: "Community" },
];

export { navLinks };

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-base">
      {/* Top bar: logo + mobile hamburger */}
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Second Chance Records home">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="1" y="1" width="22" height="22" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-brick" />
            <line x1="7" y1="1" x2="7" y2="23" stroke="currentColor" strokeWidth="1.5" className="text-brick" />
            <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" className="text-brick" />
            <line x1="17" y1="1" x2="17" y2="23" stroke="currentColor" strokeWidth="1.5" className="text-brick" />
            <line x1="7" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" className="text-brick" />
            <path d="M17 8 L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-brick" />
          </svg>
          <span className="font-heading text-cream text-lg tracking-widest">
            Second Chance Records
          </span>
        </Link>

        <button
          type="button"
          className="md:hidden p-2 text-cream hover:text-brick transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav bar — always visible on desktop */}
      <nav className="hidden md:block border-t border-white/10 bg-card" aria-label="Main navigation">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-6 px-6 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono uppercase text-xs tracking-wider text-cream hover:text-brick transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
