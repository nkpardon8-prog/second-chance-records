"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { navLinks } from "./Header";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className={`fixed inset-0 z-50 bg-base/95 backdrop-blur-sm flex flex-col items-center justify-center transition-opacity duration-300 lg:hidden ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-cream hover:text-brick transition-colors"
        aria-label="Close menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="6" y1="18" x2="18" y2="6" />
        </svg>
      </button>

      <nav className="flex flex-col items-center gap-6" aria-label="Mobile navigation">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="font-heading text-4xl text-cream hover:text-brick transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <p className="absolute bottom-8 font-accent text-gold text-sm">
        Second chances for humans &amp; hi-fi
      </p>
    </div>
  );
}
