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
          className={i < rating ? "text-gold fill-gold" : "text-gold fill-none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M8 1.5l1.85 3.75 4.15.6-3 2.93.71 4.12L8 10.88 4.29 12.9l.71-4.12-3-2.93 4.15-.6L8 1.5z" fill={i < rating ? "currentColor" : "none"} />
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
    <div className="bg-card text-cream p-8 rounded-sm flex flex-col">
      {rating && <StarRating rating={rating} />}
      <blockquote className="mt-3 flex-1">
        <span className="text-gold text-4xl font-heading leading-none">&ldquo;</span>
        <p className="font-sans text-lg italic text-cream/90 leading-relaxed -mt-4 ml-4">
          {quote}
        </p>
      </blockquote>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-sm text-muted">{author}</span>
        <span className="font-mono text-xs uppercase px-2 py-0.5 rounded-sm bg-white/10">
          {platformLabels[platform] || platform}
        </span>
      </div>
    </div>
  );
}
