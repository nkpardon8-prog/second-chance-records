import Card from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";
import SectionHeading from "@/components/ui/SectionHeading";

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
      <h3 className="font-heading text-2xl font-bold text-[var(--color-primary)] mb-6">
        {title}
      </h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => (
          <Card key={record.id} className="flex flex-col">
            <div className="aspect-square rounded-lg bg-[var(--color-primary)]/5 mb-4 flex items-center justify-center overflow-hidden">
              {record.imageUrl ? (
                <img
                  src={record.imageUrl}
                  alt={`${record.title} by ${record.artist}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <circle cx="24" cy="24" r="20" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.2" />
                  <circle cx="24" cy="24" r="4" fill="var(--color-primary)" opacity="0.2" />
                </svg>
              )}
            </div>
            <h4 className="font-heading text-lg font-bold text-[var(--color-primary)]">
              {record.title}
            </h4>
            {record.artist && (
              <p className="text-sm text-[var(--color-primary)]/60 mt-1">{record.artist}</p>
            )}
            <div className="mt-auto pt-4">
              <ExternalLink
                href={record.discogsUrl}
                showIcon
                className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
              >
                View on Discogs
              </ExternalLink>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
