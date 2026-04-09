import type { Metadata } from "next";
import { getReviews } from "@/lib/actions/reviews";
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
    <>
      <section className="bg-base text-cream py-20 grain-overlay torn-edge text-center">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">Reviews</h1>
          <p className="font-mono text-sm text-muted uppercase tracking-wider mt-2">
            What our community says
          </p>
        </div>
      </section>

      <div className="bg-kraft py-16 px-6">
        <div className="max-w-5xl mx-auto">
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
            <p className="text-center text-muted py-8 mb-12 font-mono">
              Reviews coming soon!
            </p>
          )}

          <div className="text-center space-y-4">
            <p className="text-lg text-base/70 font-sans">
              Had a great experience? We&apos;d love to hear from you!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <ExternalLink
                href="https://www.google.com/maps/place/Second+Chance+Records"
                className="inline-flex items-center justify-center rounded-sm bg-brick text-cream px-6 py-3 font-mono uppercase text-sm tracking-wider hover:bg-brick/90 transition-colors"
              >
                Review on Google
              </ExternalLink>
              <ExternalLink
                href="https://www.yelp.com/biz/second-chance-records-portland"
                className="inline-flex items-center justify-center rounded-sm border-2 border-brick text-brick px-6 py-3 font-mono uppercase text-sm tracking-wider hover:bg-brick hover:text-cream transition-colors"
              >
                Review on Yelp
              </ExternalLink>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
