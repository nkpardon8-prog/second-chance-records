import type { Metadata } from "next";
import { getPageContent } from "@/lib/actions/content";
import { getResources } from "@/lib/actions/resources";
import ExternalLink from "@/components/ui/ExternalLink";
import InlineEditor from "@/components/admin/InlineEditor";

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
    <>
      <section className="bg-base text-cream py-20 grain-overlay torn-edge text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">Our Mission</h1>
          <p className="font-mono text-sm text-kraft/70 uppercase tracking-wider mt-2">
            Second chances for humans &amp; hi-fi
          </p>
          {content.length > 0 ? (
            <div className="prose prose-lg prose-invert mx-auto mt-8 font-sans">
              {content.map((block) => (
                <InlineEditor key={block.id} contentId={block.id} content={block.content}>
                  <div dangerouslySetInnerHTML={{ __html: block.content }} />
                </InlineEditor>
              ))}
            </div>
          ) : (
            <InlineEditor pageSlug="mission" sectionKey="mission-statement" content="Second Chance Records is more than a record store. We believe everyone and everything deserves a second chance. From restoring discarded vinyl to supporting our community, we put that belief into practice every day.">
              <p className="text-lg text-cream max-w-2xl mx-auto mt-8 font-sans leading-relaxed">
                Second Chance Records is more than a record store. We believe everyone and everything
                deserves a second chance. From restoring discarded vinyl to supporting our community,
                we put that belief into practice every day.
              </p>
            </InlineEditor>
          )}
        </div>
      </section>

      <div className="bg-kraft py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <section className="mb-16">
            <h3 className="font-heading text-2xl uppercase tracking-tight text-base text-center mb-8">
              Our Pillars
            </h3>
            <div className="grid gap-6 sm:grid-cols-3">
              {advocacyPillars.map((pillar) => (
                <div key={pillar.title} className="bg-card text-cream p-6 rounded-sm border border-white/5 hover:border-brick/30 transition-colors">
                  <h4 className="font-heading text-lg uppercase text-brick mb-2">
                    {pillar.title}
                  </h4>
                  <p className="text-sm text-cream font-sans">{pillar.description}</p>
                </div>
              ))}
            </div>
          </section>

          {resources.length > 0 && (
            <section>
              <h3 className="font-heading text-2xl uppercase tracking-tight text-base text-center mb-8">
                Community Resources
              </h3>
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div key={resource.id} className="bg-card text-cream p-6 rounded-sm border border-white/5 hover:border-brick/30 transition-colors flex items-start gap-4">
                    <div className="flex-1">
                      <ExternalLink
                        href={resource.url}
                        showIcon
                        className="font-heading text-lg text-brick hover:text-gold transition-colors"
                      >
                        {resource.name}
                      </ExternalLink>
                      {resource.description && (
                        <p className="mt-1 text-sm text-cream font-sans">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
