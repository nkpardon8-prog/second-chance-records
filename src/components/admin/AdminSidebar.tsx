"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  unreadCount?: number;
}

const navItems = [
  { label: "Dashboard", href: "/admin" },
  {
    label: "Pages",
    href: "/admin/pages/home",
    children: [
      { label: "Home", href: "/admin/pages/home" },
      { label: "About", href: "/admin/pages/about" },
      { label: "Shop", href: "/admin/pages/shop" },
      { label: "Events", href: "/admin/pages/events" },
      { label: "Mission", href: "/admin/pages/mission" },
      { label: "Visit", href: "/admin/pages/visit" },
      { label: "Contact", href: "/admin/pages/contact" },
      { label: "Reviews", href: "/admin/pages/reviews" },
      { label: "Community", href: "/admin/pages/community" },
    ],
  },
  { label: "Events", href: "/admin/events" },
  { label: "News", href: "/admin/news" },
  { label: "Featured Records", href: "/admin/records" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Partners", href: "/admin/partners" },
  { label: "Community Resources", href: "/admin/resources" },
  { label: "Instagram", href: "/admin/instagram" },
  { label: "Subscribers", href: "/admin/subscribers" },
  { label: "Contact Submissions", href: "/admin/contact-submissions" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminSidebar({ unreadCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(pathname.startsWith("/admin/pages"));

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const linkClasses = (href: string) =>
    `block px-3 py-2 rounded-sm font-mono text-sm transition-colors ${
      isActive(href)
        ? "text-brick bg-white/5 font-medium"
        : "text-white hover:text-cream hover:bg-white/5"
    }`;

  const nav = (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map((item) => {
        if (item.children) {
          return (
            <div key={item.label}>
              <button
                onClick={() => setPagesOpen(!pagesOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm font-mono text-sm transition-colors ${
                  pathname.startsWith("/admin/pages")
                    ? "text-brick bg-white/5 font-medium"
                    : "text-white hover:text-cream hover:bg-white/5"
                }`}
              >
                {item.label}
                <span className={`transition-transform ${pagesOpen ? "rotate-90" : ""}`}>
                  &#9654;
                </span>
              </button>
              {pagesOpen && (
                <div className="ml-4 mt-1 flex flex-col gap-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={linkClasses(child.href)}
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={linkClasses(item.href)}
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex items-center justify-between">
              {item.label}
              {item.label === "Contact Submissions" && unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-brick text-cream text-xs w-5 h-5">
                  {unreadCount}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-sm shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        <span className="block w-5 h-0.5 bg-cream mb-1" />
        <span className="block w-5 h-0.5 bg-cream mb-1" />
        <span className="block w-5 h-0.5 bg-cream" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#2A2A2A] border-r border-white/10 overflow-y-auto transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/5 lg:hidden">
          <span className="font-mono text-sm text-cream uppercase tracking-wider">Menu</span>
        </div>
        {nav}
      </aside>
    </>
  );
}
