import Hero from "@/components/home/Hero";
import FeaturedRecords from "@/components/home/FeaturedRecords";
import InstagramFeed from "@/components/home/InstagramFeed";
import QuickLinks from "@/components/home/QuickLinks";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { db } from "@/lib/db";
import { news } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function Home() {
  const latestNews = await db
    .select()
    .from(news)
    .where(eq(news.isPublished, true))
    .orderBy(desc(news.publishedAt))
    .limit(2);

  return (
    <>
      <Hero />
      <FeaturedRecords />

      {latestNews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading subtitle="What's happening at the store">
            Latest News
          </SectionHeading>
          <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            {latestNews.map((post) => (
              <Card key={post.id}>
                <h3 className="font-heading text-xl font-bold text-[var(--color-primary)]">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-primary)]/60">
                  {post.publishedAt.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-3 text-[var(--color-primary)]/70 text-sm line-clamp-3">
                  {post.content}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="bg-[var(--color-secondary)] text-[var(--color-white)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">Stay in the Loop</h2>
          <p className="mt-3 text-lg text-[var(--color-white)]/80 max-w-xl mx-auto">
            New arrivals, events, and community news delivered to your inbox.
          </p>
          <div className="mt-8 flex justify-center">
            <NewsletterSignup />
          </div>
        </div>
      </section>

      <InstagramFeed />
      <QuickLinks />
    </>
  );
}
