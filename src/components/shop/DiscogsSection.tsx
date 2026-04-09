import ExternalLink from "@/components/ui/ExternalLink";

interface Record {
  id: number;
  title: string;
  artist: string | null;
  discogsUrl: string;
  imageUrl: string | null;
  description: string | null;
}

interface DiscogsSectionProps {
  title: string;
  records: Record[];
}

export default function DiscogsSection({ title, records }: DiscogsSectionProps) {
  if (records.length === 0) return null;

  return (
    <section className="mb-12">
      <h3 className="font-heading text-2xl uppercase tracking-tight text-base mb-6">
        {title}
      </h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => (
          <div key={record.id} className="bg-card text-cream p-6 rounded-sm border border-white/5 hover:border-brick/30 transition-colors flex flex-col">
            <div className="aspect-square rounded-sm bg-white/5 mb-4 flex items-center justify-center overflow-hidden">
              {record.imageUrl ? (
                <img
                  src={record.imageUrl}
                  alt={`${record.title} by ${record.artist}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
                  <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.2" />
                </svg>
              )}
            </div>
            <h4 className="font-heading text-lg uppercase tracking-tight text-cream">
              {record.title}
            </h4>
            {record.artist && (
              <p className="text-sm text-muted mt-1 font-mono">{record.artist}</p>
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
