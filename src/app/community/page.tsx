import type { Metadata } from "next";
import { getPartners } from "@/lib/actions/partners";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
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
    url: "https://www.instagram.com/secondchancerecords",
    description: "Follow us for new arrivals, events, and behind-the-scenes looks.",
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/secondchancerecords",
    description: "Join our community for updates and event announcements.",
  },
  {
    name: "Discogs",
    url: "https://www.discogs.com/seller/SecondChance_Records/profile",
    description: "Browse and buy from our full inventory of restored vinyl.",
  },
];

export default async function CommunityPage() {
  const allPartners = await getPartners();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="Connect with us and our community">
        Community
      </SectionHeading>

      <section className="mb-16">
        <h3 className="font-heading text-2xl font-bold text-[var(--color-primary)] text-center mb-8">
          Find Us Online
        </h3>
        <div className="grid gap-6 sm:grid-cols-3">
          {socialLinks.map((link) => (
            <Card key={link.name} className="text-center">
              <ExternalLink
                href={link.url}
                showIcon
                className="font-heading text-xl font-bold text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
              >
                {link.name}
              </ExternalLink>
              <p className="mt-2 text-sm text-[var(--color-primary)]/60">
                {link.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {allPartners.length > 0 && (
        <section>
          <h3 className="font-heading text-2xl font-bold text-[var(--color-primary)] text-center mb-8">
            Community Partners
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allPartners.map((partner) => (
              <Card key={partner.id} className="flex flex-col">
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
                  className="font-heading text-lg font-bold text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
                >
                  {partner.name}
                </ExternalLink>
                {partner.description && (
                  <p className="mt-2 text-sm text-[var(--color-primary)]/70 flex-1">
                    {partner.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
