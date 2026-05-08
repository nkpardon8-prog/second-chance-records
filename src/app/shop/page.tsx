import type { Metadata } from "next";
import { getPageContent } from "@/lib/actions/content";
import { getSwagItems } from "@/lib/actions/shop-swag";
import ExternalLink from "@/components/ui/ExternalLink";
import InlineEditor from "@/components/admin/InlineEditor";
import ProseContent from "@/components/ui/ProseContent";
import SwagGrid from "@/components/shop/SwagGrid";

export const metadata: Metadata = {
  title: "Shop | Second Chance Records",
  description:
    "Browse our curated collection of restored vinyl records and shop swag. Visit us in Portland or DM to purchase.",
  openGraph: {
    title: "Shop | Second Chance Records",
    description:
      "Browse our curated collection of restored vinyl records on Discogs.",
  },
};

export default async function ShopPage() {
  const [content, swag] = await Promise.all([
    getPageContent("shop"),
    getSwagItems(),
  ]);

  const find = (key: string) => content.find((b) => b.sectionKey === key);
  const mainTitle = find("main_title");
  const description = find("description");
  const blurb = find("swag_purchase_blurb");

  return (
    <>
      <section className="bg-base text-cream py-20 grain-overlay torn-edge text-center">
        <div className="max-w-5xl mx-auto px-6">
          {mainTitle ? (
            <InlineEditor contentId={mainTitle.id} content={mainTitle.content}>
              <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">
                {mainTitle.content.trim() || "Shop"}
              </h1>
            </InlineEditor>
          ) : (
            <InlineEditor pageSlug="shop" sectionKey="main_title" content="Shop Our Records">
              <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">Shop</h1>
            </InlineEditor>
          )}

          <InlineEditor pageSlug="shop" sectionKey="shop-subtitle" content="Restored vinyl, ready for a second spin">
            <p className="font-mono text-sm text-kraft/70 uppercase tracking-wider mt-2">
              Restored vinyl, ready for a second spin
            </p>
          </InlineEditor>

          <div className="mt-8">
            <ExternalLink
              href="https://www.discogs.com/seller/SecondChance_Records/profile"
              className="inline-flex items-center justify-center rounded-sm bg-brick text-cream px-8 py-3.5 font-mono uppercase text-sm tracking-wider hover:bg-brick/90 transition-colors"
            >
              Browse Our Full Inventory on Discogs
            </ExternalLink>
          </div>
        </div>
      </section>

      <div className="bg-kraft py-16 px-6">
        <div className="max-w-3xl mx-auto">
          {description ? (
            <InlineEditor contentId={description.id} content={description.content}>
              <div className="prose prose-lg mx-auto mb-12 font-sans leading-relaxed">
                <ProseContent text={description.content || "Tell visitors about your shop."} />
              </div>
            </InlineEditor>
          ) : null}
        </div>

        {blurb && blurb.content.trim() && (
          <div className="max-w-3xl mx-auto">
            <InlineEditor contentId={blurb.id} content={blurb.content}>
              <p className="font-mono text-sm text-base/80 text-center mb-8">
                {blurb.content}
              </p>
            </InlineEditor>
          </div>
        )}

        {swag.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <SwagGrid items={swag} />
          </div>
        )}
      </div>
    </>
  );
}
