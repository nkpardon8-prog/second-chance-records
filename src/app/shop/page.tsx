import type { Metadata } from "next";
import { getFeaturedRecords } from "@/lib/actions/records";
import ExternalLink from "@/components/ui/ExternalLink";
import DiscogsSection from "@/components/shop/DiscogsSection";
import InlineEditor from "@/components/admin/InlineEditor";

export const metadata: Metadata = {
  title: "Shop | Second Chance Records",
  description:
    "Browse our curated collection of restored vinyl records. New arrivals, staff picks, and local Portland artists.",
  openGraph: {
    title: "Shop | Second Chance Records",
    description:
      "Browse our curated collection of restored vinyl records on Discogs.",
  },
};

export default async function ShopPage() {
  const [newArrivals, staffPicks, localArtists] = await Promise.all([
    getFeaturedRecords("new_arrivals"),
    getFeaturedRecords("staff_picks"),
    getFeaturedRecords("local_artists"),
  ]);

  return (
    <>
      <section className="bg-base text-cream py-20 grain-overlay torn-edge text-center">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">Shop</h1>
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
        <div className="max-w-5xl mx-auto">
          <DiscogsSection title="New Arrivals" records={newArrivals} />
          <DiscogsSection title="Staff Picks" records={staffPicks} />
          <DiscogsSection title="Local Artists" records={localArtists} />
        </div>
      </div>
    </>
  );
}
