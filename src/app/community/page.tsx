import type { Metadata } from "next";
import { getPartners } from "@/lib/actions/partners";
import SectionHeading from "@/components/ui/SectionHeading";
import ExternalLink from "@/components/ui/ExternalLink";

export const metadata: Metadata = {
  title: "Community | Second Chance Records",
  description:
    "Connect with Second Chance Records on social media and meet our community partners in Portland, OR.",
  openGraph: {
    title: "Community | Second Chance Records",
    description:
      "Our community partners and social links.",
  },
};

const socialLinks = [
  {
    name: "Instagram",
    url: "https://instagram.com/second_chance_recordspdx",
    description: "Follow us for new arrivals, events, and behind-the-scenes looks.",
  },
  {
    name: "Discogs",
    url: "https://www.discogs.com/seller/SecondChance_Records/profile",
    description: "Browse and buy from our full inventory of restored vinyl.",
  },
];

export default async function CommunityPage() {
  const allPartners = await getPartners();

  const cherryBombs = allPartners.find(
    (p) => p.name.toLowerCase().includes("cherry bomb")
  );
  const otherPartners = allPartners.filter((p) => p.id !== cherryBombs?.id);

  return (
    <div className="bg-kraft min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <SectionHeading subtitle="Connect with us and our community">
          Community
        </SectionHeading>

        <section className="mb-16">
          <h3 className="font-heading text-2xl uppercase tracking-tight text-base text-center mb-8">
            Find Us Online
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            {socialLinks.map((link) => (
              <div key={link.name} className="bg-card text-cream p-8 rounded-sm border border-white/5 hover:border-brick/30 transition-colors text-center">
                <ExternalLink
                  href={link.url}
                  showIcon
                  className="font-heading text-xl text-brick hover:text-gold transition-colors"
                >
                  {link.name}
                </ExternalLink>
                <p className="mt-2 text-sm text-cream font-sans">
                  {link.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {cherryBombs && (
          <section className="mb-16 bg-base text-cream p-8 md:p-12 rounded-sm grain-overlay relative">
            <div className="relative z-10 text-center">
              {cherryBombs.logoUrl && (
                <div className="h-20 mb-6 flex items-center justify-center">
                  <img
                    src={cherryBombs.logoUrl}
                    alt={cherryBombs.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              <h3 className="font-heading text-2xl uppercase tracking-tight text-brick">
                {cherryBombs.name}
              </h3>
              {cherryBombs.description && (
                <p className="mt-3 text-cream font-sans max-w-xl mx-auto">
                  {cherryBombs.description}
                </p>
              )}
              <div className="mt-4">
                <ExternalLink
                  href={cherryBombs.url}
                  showIcon
                  className="text-brick hover:text-gold font-mono"
                >
                  Learn more
                </ExternalLink>
              </div>
            </div>
          </section>
        )}

        {otherPartners.length > 0 && (
          <section>
            <h3 className="font-heading text-2xl uppercase tracking-tight text-base text-center mb-8">
              Community Partners
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherPartners.map((partner) => (
                <div key={partner.id} className="bg-card text-cream p-6 rounded-sm border border-white/5 hover:border-brick/30 transition-colors flex flex-col">
                  {partner.logoUrl && (
                    <div className="h-16 mb-4 flex items-center">
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <ExternalLink
                    href={partner.url}
                    showIcon
                    className="font-heading text-lg text-brick hover:text-gold transition-colors"
                  >
                    {partner.name}
                  </ExternalLink>
                  {partner.description && (
                    <p className="mt-2 text-sm text-cream flex-1 font-sans">
                      {partner.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
