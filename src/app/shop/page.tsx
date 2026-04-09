import type { Metadata } from "next";
import { getFeaturedRecords } from "@/lib/actions/records";
import SectionHeading from "@/components/ui/SectionHeading";
import ExternalLink from "@/components/ui/ExternalLink";
import DiscogsSection from "@/components/shop/DiscogsSection";

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
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="Restored vinyl, ready for a second spin">
        Shop
      </SectionHeading>

      <div className="text-center mb-12">
        <ExternalLink
          href="https://www.discogs.com/seller/SecondChance_Records/profile"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-7 py-3 text-lg font-medium text-[var(--color-white)] transition-colors hover:bg-[var(--color-accent)]/90"
        >
          Browse Our Full Inventory on Discogs
        </ExternalLink>
      </div>

      <DiscogsSection title="New Arrivals" records={newArrivals} />
      <DiscogsSection title="Staff Picks" records={staffPicks} />
      <DiscogsSection title="Local Artists" records={localArtists} />
    </div>
  );
}
