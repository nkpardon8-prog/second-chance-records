import ExternalLink from "@/components/ui/ExternalLink";

interface EventCardProps {
  title: string;
  date: string;
  time: string | null;
  description: string | null;
  artistName: string | null;
  artistUrl: string | null;
  imageUrl: string | null;
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
  imageUrl,
}: EventCardProps) {
  return (
    <div className="bg-card text-cream p-6 rounded-sm border border-white/5 flex flex-col sm:flex-row gap-6">
      {imageUrl && (
        <div className="sm:w-48 shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-48 sm:h-full object-cover rounded-sm"
            loading="lazy"
          />
        </div>
      )}
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
          <p className="mt-3 text-cream/70 text-sm leading-relaxed font-sans">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
