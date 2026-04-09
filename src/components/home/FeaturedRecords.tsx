import { db } from "@/lib/db";
import { featuredRecords } from "@/lib/db/schema";
import SectionHeading from "@/components/ui/SectionHeading";
import ExternalLink from "@/components/ui/ExternalLink";

export default async function FeaturedRecords() {
  const records = await db
    .select()
    .from(featuredRecords)
    .orderBy(featuredRecords.sortOrder)
    .limit(6);

  if (records.length === 0) return null;

  return (
    <section className="bg-kraft py-16 px-6">
      <SectionHeading subtitle="Hand-picked vinyl for every ear">
        Featured Records
      </SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-8">
        {records.map((record) => (
          <div key={record.id} className="bg-card text-cream p-6 rounded-sm border border-white/5 hover:border-brick/30 transition-colors flex flex-col">
            <div className="aspect-square rounded-sm bg-white/5 mb-4 flex items-center justify-center overflow-hidden">
              {record.imageUrl ? (
                <img
                  src={record.imageUrl}
                  alt={`${record.title} by ${record.artist}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
                  <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.2" />
                </svg>
              )}
            </div>
            <h3 className="font-heading text-lg uppercase tracking-tight text-cream">
              {record.title}
            </h3>
            {record.artist && (
              <p className="font-mono text-xs text-gold uppercase mt-1">{record.artist}</p>
            )}
            <div className="mt-auto pt-4">
              <ExternalLink
                href={record.discogsUrl}
                showIcon
                className="text-brick hover:text-gold text-sm font-mono"
              >
                View on Discogs
              </ExternalLink>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
