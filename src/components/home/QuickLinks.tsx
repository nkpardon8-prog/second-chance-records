import Link from "next/link";
import ExternalLink from "@/components/ui/ExternalLink";

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
    <section className="bg-kraft py-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {links.map((link) => (
          <div key={link.title} className="bg-card text-cream p-8 rounded-sm border border-white/5 hover:border-brick/30 transition-all group flex flex-col">
            <h3 className="font-heading text-xl uppercase tracking-tight">
              {link.title}
            </h3>
            <p className="mt-2 text-sm text-cream/70 flex-1">
              {link.description}
            </p>
            <div className="mt-4">
              {link.external ? (
                <ExternalLink
                  href={link.href}
                  showIcon
                  className="text-brick hover:text-gold text-sm font-mono group-hover:translate-x-1 transition-transform"
                >
                  Go &rarr;
                </ExternalLink>
              ) : (
                <Link
                  href={link.href}
                  className="text-brick hover:text-gold text-sm font-mono inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  Go &rarr;
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
