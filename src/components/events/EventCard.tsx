import ExternalLink from "@/components/ui/ExternalLink";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { keyFromImageUrl } from "@/lib/image-store";
import type { EventImage } from "@/types";

interface EventCardProps {
  title: string;
  date: string;
  time: string | null;
  description: string | null;
  artistName: string | null;
  artistUrl: string | null;
  images: EventImage[];
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EventCard({
  title,
  date,
  time,
  description,
  artistName,
  artistUrl,
  images,
}: EventCardProps) {
  return (
    <div className="bg-card text-cream p-6 rounded-sm border border-white/5">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 font-mono text-gold text-sm uppercase mb-2">
          <time dateTime={date}>{formatDate(date)}</time>
          {time && (
            <>
              <span aria-hidden="true">|</span>
              <span>{time}</span>
            </>
          )}
        </div>
        <h3 className="font-heading text-xl uppercase tracking-tight">{title}</h3>
        {artistName && (
          <p className="mt-1 text-sm">
            {artistUrl ? (
              <ExternalLink
                href={artistUrl}
                showIcon
                className="text-brick hover:text-gold transition-colors"
              >
                {artistName}
              </ExternalLink>
            ) : (
              <span className="text-brick">{artistName}</span>
            )}
          </p>
        )}
        {description && (
          <p className="mt-3 text-cream text-sm leading-relaxed font-sans">
            {description}
          </p>
        )}
      </div>

      {images.length > 0 && (() => {
        // Defense in depth: filter out any image whose URL doesn't decode to one
        // of our own /api/images/events/* keys. The server action also rejects
        // foreign URLs at write time, but rendering through this guard means a
        // stored bad row (legacy data, schema migration accident, etc) can never
        // produce a clickable javascript:/cross-origin link in this card.
        const safeImages = images.filter((img) => {
          const key = keyFromImageUrl(img.url);
          return key !== null && key.startsWith("events/");
        });
        if (safeImages.length === 0) return null;
        return (
          <div
            className="mt-4 grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
          >
            {safeImages.map((img) => (
              <div
                key={img.id}
                className="bg-base border border-white/5 rounded-sm overflow-hidden h-64 flex items-center justify-center hover:border-brick/40 transition-colors"
              >
                <ImageLightbox
                  src={img.url}
                  alt={title}
                  thumbnailClassName="w-full h-full"
                />
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
