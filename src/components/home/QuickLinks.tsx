import Link from "next/link";
import ExternalLink from "@/components/ui/ExternalLink";
import Card from "@/components/ui/Card";

const links = [
  {
    title: "Shop on Discogs",
    description: "Browse our full inventory of restored and curated vinyl records.",
    href: "https://www.discogs.com/seller/SecondChance_Records/profile",
    external: true,
  },
  {
    title: "Upcoming Events",
    description: "Live music, listening parties, and community gatherings at the store.",
    href: "/events",
    external: false,
  },
  {
    title: "Visit the Store",
    description: "5744 E Burnside St, Suite 104, Portland, OR. Thu-Sun 12-8pm.",
    href: "/visit",
    external: false,
  },
];

export default function QuickLinks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-3">
        {links.map((link) => (
          <Card key={link.title} className="flex flex-col hover:shadow-md transition-shadow">
            <h3 className="font-heading text-xl font-bold text-[var(--color-primary)]">
              {link.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--color-primary)]/60 flex-1">
              {link.description}
            </p>
            <div className="mt-4">
              {link.external ? (
                <ExternalLink
                  href={link.href}
                  showIcon
                  className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
                >
                  Go &rarr;
                </ExternalLink>
              ) : (
                <Link
                  href={link.href}
                  className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
                >
                  Go &rarr;
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
