import type { Metadata } from "next";
import { getPageContent } from "@/lib/actions/content";
import { getPressMentions } from "@/lib/actions/press-mentions";
import SectionHeading from "@/components/ui/SectionHeading";
import ExternalLink from "@/components/ui/ExternalLink";
import InlineEditor from "@/components/admin/InlineEditor";
import ProseContent from "@/components/ui/ProseContent";

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

export default async function AboutPage() {
  const [content, pressMentions] = await Promise.all([
    getPageContent("about"),
    getPressMentions(),
  ]);

  return (
    <div className="bg-kraft min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <SectionHeading subtitle="The story behind the records">
          About Us
        </SectionHeading>

        {content.some((b) => b.content.trim() !== "") ? (
          <div className="prose prose-lg mx-auto mb-12 font-sans leading-relaxed">
            {content
              .filter((block) => block.content.trim() !== "")
              .map((block) => (
                <InlineEditor key={block.id} contentId={block.id} content={block.content}>
                  <ProseContent text={block.content} />
                </InlineEditor>
              ))}
          </div>
        ) : (
          <>
            <section className="mb-12">
              <h3 className="font-heading text-2xl uppercase tracking-tight text-base mb-4">
                Tasha&apos;s Story
              </h3>
              <InlineEditor pageSlug="about" sectionKey="tashas-story" content="Second Chance Records was born from a simple idea: everyone deserves a second chance — people and records alike. Founded in Portland, Oregon, we specialize in restoring and curating vinyl records while building a welcoming space for our community.">
                <p className="text-base leading-relaxed font-sans">
                  Second Chance Records was born from a simple idea: everyone deserves a second chance
                  &mdash; people and records alike. Founded in Portland, Oregon, we specialize in
                  restoring and curating vinyl records while building a welcoming space for our community.
                </p>
              </InlineEditor>
              <blockquote className="font-accent text-2xl text-brick border-l-4 border-gold pl-6 my-8">
                Everyone deserves a second chance &mdash; people and records alike.
              </blockquote>
            </section>

            <section className="mb-12">
              <h3 className="font-heading text-2xl uppercase tracking-tight text-base mb-4">
                Record Restoration
              </h3>
              <InlineEditor pageSlug="about" sectionKey="record-restoration" content="Every record that comes through our doors gets a second chance. We carefully clean, grade, and restore vinyl records so they can be enjoyed again. From deep cleaning to sleeve replacement, we bring each record back to its best possible condition.">
                <p className="text-base leading-relaxed font-sans">
                  Every record that comes through our doors gets a second chance. We carefully clean,
                  grade, and restore vinyl records so they can be enjoyed again. From deep cleaning to
                  sleeve replacement, we bring each record back to its best possible condition.
                </p>
              </InlineEditor>
            </section>
          </>
        )}

        {pressMentions.length > 0 && (
          <section>
            <h3 className="font-heading text-2xl uppercase tracking-tight text-base text-center mb-6">
              Press Mentions
            </h3>
            <div data-testid="press-mentions-list" className="flex flex-wrap justify-center gap-4">
              {pressMentions.map((mention) => (
                <div
                  key={mention.id}
                  className="bg-card text-cream p-6 rounded-sm border border-white/5 text-center w-full sm:w-56"
                >
                  <ExternalLink
                    href={mention.url}
                    showIcon
                    className="font-heading text-lg text-brick hover:text-gold transition-colors"
                  >
                    {mention.name}
                  </ExternalLink>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
