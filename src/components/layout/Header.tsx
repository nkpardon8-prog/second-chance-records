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
    <header className="sticky top-0 z-50 bg-[var(--color-white)] border-b border-[var(--color-primary)]/10 shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Second Chance Records home">
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="2" y="2" width="32" height="32" rx="3" stroke="var(--color-accent)" strokeWidth="2.5" />
            <rect x="8" y="2" width="4" height="32" fill="var(--color-accent)" />
            <rect x="16" y="2" width="4" height="32" fill="var(--color-accent)" />
            <rect x="24" y="2" width="4" height="32" fill="var(--color-accent)" />
            <rect x="8" y="20" width="20" height="3" fill="var(--color-background)" />
            <path d="M28 20 L32 16" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-heading text-lg font-bold tracking-tight text-[var(--color-primary)] sm:text-xl">
            Second Chance Records
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-[var(--color-primary)] rounded-md transition-colors hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="lg:hidden p-2 rounded-md text-[var(--color-primary)] hover:bg-[var(--color-accent)]/10 transition-colors"
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

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
