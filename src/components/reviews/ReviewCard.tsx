import Card from "@/components/ui/Card";

interface ReviewCardProps {
  quote: string;
  author: string;
  platform: string;
  rating: number | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill={i < rating ? "var(--color-accent)" : "none"}
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M8 1.5l1.85 3.75 4.15.6-3 2.93.71 4.12L8 10.88 4.29 12.9l.71-4.12-3-2.93 4.15-.6L8 1.5z" />
        </svg>
      ))}
    </div>
  );
}

const platformLabels: Record<string, string> = {
  google: "Google",
  yelp: "Yelp",
};

export default function ReviewCard({ quote, author, platform, rating }: ReviewCardProps) {
  return (
    <Card className="flex flex-col">
      {rating && <StarRating rating={rating} />}
      <blockquote className="mt-3 text-lg leading-relaxed text-[var(--color-primary)] italic flex-1">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-primary)]">{author}</span>
        <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/5 px-3 py-1 text-xs font-medium text-[var(--color-primary)]/60">
          {platformLabels[platform] || platform}
        </span>
      </div>
    </Card>
  );
}
