import type { Metadata } from "next";
import { getPageContent } from "@/lib/actions/content";
import { getResources } from "@/lib/actions/resources";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";

export const metadata: Metadata = {
  title: "Mission | Second Chance Records",
  description:
    "Our mission: second chances for humans and hi-fi. Learn about our advocacy, community resources, and what drives us.",
  openGraph: {
    title: "Mission | Second Chance Records",
    description:
      "Second chances for humans and hi-fi. Our advocacy and community work.",
  },
};

const advocacyPillars = [
  {
    title: "Record Restoration",
    description:
      "We give discarded vinyl a second life through careful cleaning, grading, and restoration.",
  },
  {
    title: "Community Support",
    description:
      "We create welcoming spaces and support local organizations working on housing, recovery, and reentry.",
  },
  {
    title: "Second Chances",
    description:
      "We believe in the power of second chances for everyone. Our hiring practices and partnerships reflect this value.",
  },
];

export default async function MissionPage() {
  const [content, resources] = await Promise.all([
    getPageContent("mission"),
    getResources(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="Second chances for humans & hi-fi">
        Our Mission
      </SectionHeading>

      {content.length > 0 ? (
        <div className="prose prose-lg mx-auto mb-12">
          {content.map((block) => (
            <div key={block.id} dangerouslySetInnerHTML={{ __html: block.content }} />
          ))}
        </div>
      ) : (
        <p className="text-center text-lg text-[var(--color-primary)]/70 max-w-2xl mx-auto mb-12">
          Second Chance Records is more than a record store. We believe everyone and everything
          deserves a second chance. From restoring discarded vinyl to supporting our community,
          we put that belief into practice every day.
        </p>
      )}

      <section className="mb-16">
        <h3 className="font-heading text-2xl font-bold text-[var(--color-primary)] text-center mb-8">
          Our Pillars
        </h3>
        <div className="grid gap-6 sm:grid-cols-3">
          {advocacyPillars.map((pillar) => (
            <Card key={pillar.title}>
              <h4 className="font-heading text-lg font-bold text-[var(--color-accent)] mb-2">
                {pillar.title}
              </h4>
              <p className="text-sm text-[var(--color-primary)]/70">{pillar.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {resources.length > 0 && (
        <section>
          <h3 className="font-heading text-2xl font-bold text-[var(--color-primary)] text-center mb-8">
            Community Resources
          </h3>
          <div className="space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <ExternalLink
                    href={resource.url}
                    showIcon
                    className="font-heading text-lg font-bold text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
                  >
                    {resource.name}
                  </ExternalLink>
                  {resource.description && (
                    <p className="mt-1 text-sm text-[var(--color-primary)]/70">
                      {resource.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
