import type { Metadata } from "next";
import Image from "next/image";
import { getPartners } from "@/lib/actions/partners";
import { getSettings } from "@/lib/actions/settings";
import { getPageContent } from "@/lib/actions/content";
import SectionHeading from "@/components/ui/SectionHeading";
import ExternalLink from "@/components/ui/ExternalLink";
import InlineEditor from "@/components/admin/InlineEditor";
import {
  DEFAULT_RESTORATION_VIDEO_TITLE,
  DEFAULT_RESTORATION_VIDEO_BLURB,
  resolveVideoUrl,
} from "@/lib/restoration-video";

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
  {
    name: "YouTube",
    url: "https://www.youtube.com/@SecondChanceRecords",
    description: "Watch shop tours, record features, and live in-store sessions.",
  },
];

const cherryBombsRoster = [
  "Lady Gaga", "Joni Mitchell",
  "Poly Styrene", "Janis Joplin",
  "Ani DiFranco", "Bjork",
  "Madonna", "Dolly Parton",
  "Siouxsie Sioux", "Grace Jones",
  "Bonnie Raitt", "Carrie Brownstein",
  "Cyndi Lauper", "Nina Simone",
  "Taylor Swift", "Beyonce",
  "Esperanza Spalding", "Joan Jett",
];

export default async function CommunityPage() {
  const [allPartners, settings, content] = await Promise.all([
    getPartners(),
    getSettings(),
    getPageContent("community"),
  ]);

  const cherryBombs = allPartners.find(
    (p) => p.name.toLowerCase().includes("cherry bomb")
  );
  const otherPartners = allPartners.filter((p) => p.id !== cherryBombs?.id);

  // "Record Care" card: hardcoded defaults with editable overrides (URL via site_settings,
  // title/blurb via page_content / InlineEditor). Each falls back to its default if unset; the URL
  // also falls back if the stored value isn't a valid http(s) link (never render a broken href).
  const videoUrl = resolveVideoUrl(settings);
  const videoTitle =
    content.find((c) => c.sectionKey === "restoration-video-title")?.content?.trim() ||
    DEFAULT_RESTORATION_VIDEO_TITLE;
  const videoBlurb =
    content.find((c) => c.sectionKey === "restoration-video-blurb")?.content?.trim() ||
    DEFAULT_RESTORATION_VIDEO_BLURB;

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
          <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
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

        <section className="mb-16">
          <h3 className="font-heading text-2xl uppercase tracking-tight text-base text-center mb-8">
            Record Care
          </h3>
          <div className="max-w-md mx-auto">
            <div className="bg-card text-cream p-8 rounded-sm border border-white/5 hover:border-brick/30 transition-colors text-center">
              <InlineEditor pageSlug="community" sectionKey="restoration-video-title" content={videoTitle}>
                <h4 className="font-heading text-xl text-brick">{videoTitle}</h4>
              </InlineEditor>
              <InlineEditor pageSlug="community" sectionKey="restoration-video-blurb" content={videoBlurb}>
                <p className="mt-2 text-sm text-cream font-sans">{videoBlurb}</p>
              </InlineEditor>
              <div className="mt-4">
                <ExternalLink href={videoUrl} showIcon className="text-brick hover:text-gold font-mono">
                  Watch on YouTube
                </ExternalLink>
              </div>
            </div>
          </div>
        </section>

        <section
          id="cherry-bombs-fc"
          className="mb-16 bg-base text-cream p-8 md:p-12 rounded-sm grain-overlay relative scroll-mt-24"
        >
          <div className="relative z-10 text-center">
            {cherryBombs && (
              <>
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
              </>
            )}

            <div className="mt-12 pt-10">
              <h4 className="font-heading text-xl uppercase tracking-tight text-brick">
                Meet the Players
              </h4>
              <p className="mt-3 text-cream font-sans max-w-xl mx-auto">
                The Cherry Bombs FC sponsor table features iconic female
                musicians as the players. Can you name them all?
              </p>
              <Image
                src="/cherry-bombs-table.jpg"
                alt="Hand-painted Cherry Bombs FC sponsor table with iconic female musicians as players"
                width={1400}
                height={1050}
                className="mx-auto my-8 rounded-sm h-auto w-full max-w-2xl"
              />
              <ul className="grid grid-cols-2 gap-x-12 gap-y-2 max-w-md mx-auto text-cream font-sans text-left">
                {cherryBombsRoster.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

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
