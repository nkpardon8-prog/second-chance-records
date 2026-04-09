import type { Metadata } from "next";
import { getReviews } from "@/lib/actions/reviews";
import SectionHeading from "@/components/ui/SectionHeading";
import ReviewCard from "@/components/reviews/ReviewCard";
import ExternalLink from "@/components/ui/ExternalLink";

export const metadata: Metadata = {
  title: "Reviews | Second Chance Records",
  description:
    "See what our customers say about Second Chance Records. Read reviews and leave your own on Google or Yelp.",
  openGraph: {
    title: "Reviews | Second Chance Records",
    description:
      "Customer reviews of Second Chance Records in Portland, OR.",
  },
};

export default async function ReviewsPage() {
  const allReviews = await getReviews();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="What our community says">
        Reviews
      </SectionHeading>

      {allReviews.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {allReviews.map((review) => (
            <ReviewCard
              key={review.id}
              quote={review.quote}
              author={review.author}
              platform={review.platform}
              rating={review.rating}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-[var(--color-primary)]/60 py-8 mb-12">
          Reviews coming soon!
        </p>
      )}

      <div className="text-center space-y-4">
        <p className="text-lg text-[var(--color-primary)]/70">
          Had a great experience? We'd love to hear from you!
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <ExternalLink
            href="https://www.google.com/maps/place/Second+Chance+Records"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 font-medium text-[var(--color-white)] transition-colors hover:bg-[var(--color-accent)]/90"
          >
            Review on Google
          </ExternalLink>
          <ExternalLink
            href="https://www.yelp.com/biz/second-chance-records-portland"
            className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-accent)] px-6 py-3 font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-white)]"
          >
            Review on Yelp
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}
