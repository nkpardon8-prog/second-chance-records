import type { Metadata } from "next";
import { getPageContent } from "@/lib/actions/content";
import SectionHeading from "@/components/ui/SectionHeading";
import ExternalLink from "@/components/ui/ExternalLink";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "About | Second Chance Records",
  description:
    "Learn about Second Chance Records, Tasha's story, and our mission to restore records and support our Portland community.",
  openGraph: {
    title: "About | Second Chance Records",
    description:
      "Learn about Second Chance Records, Tasha's story, and our mission to restore records and support our Portland community.",
  },
};

const pressMentions = [
  {
    name: "Willamette Week",
    url: "https://www.wweek.com",
  },
  {
    name: "KMHD Jazz Radio",
    url: "https://www.kmhd.org",
  },
  {
    name: "Travel Portland",
    url: "https://www.travelportland.com",
  },
];

export default async function AboutPage() {
  const content = await getPageContent("about");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="The story behind the records">
        About Us
      </SectionHeading>

      {content.length > 0 ? (
        <div className="prose prose-lg mx-auto mb-12">
          {content.map((block) => (
            <div key={block.id} dangerouslySetInnerHTML={{ __html: block.content }} />
          ))}
        </div>
      ) : (
        <>
          <section className="mb-12">
            <h3 className="font-heading text-2xl font-bold text-[var(--color-primary)] mb-4">
              Tasha's Story
            </h3>
            <p className="text-[var(--color-primary)]/70 leading-relaxed">
              Second Chance Records was born from a simple idea: everyone deserves a second chance
              &mdash; people and records alike. Founded in Portland, Oregon, we specialize in
              restoring and curating vinyl records while building a welcoming space for our community.
            </p>
          </section>

          <section className="mb-12">
            <h3 className="font-heading text-2xl font-bold text-[var(--color-primary)] mb-4">
              Record Restoration
            </h3>
            <p className="text-[var(--color-primary)]/70 leading-relaxed">
              Every record that comes through our doors gets a second chance. We carefully clean,
              grade, and restore vinyl records so they can be enjoyed again. From deep cleaning to
              sleeve replacement, we bring each record back to its best possible condition.
            </p>
          </section>
        </>
      )}

      <section>
        <h3 className="font-heading text-2xl font-bold text-[var(--color-primary)] mb-6">
          Press Mentions
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {pressMentions.map((mention) => (
            <Card key={mention.name} className="text-center">
              <ExternalLink
                href={mention.url}
                showIcon
                className="font-heading text-lg font-bold text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
              >
                {mention.name}
              </ExternalLink>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
