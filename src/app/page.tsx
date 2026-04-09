import Hero from "@/components/home/Hero";
import FeaturedRecords from "@/components/home/FeaturedRecords";
import InstagramFeed from "@/components/home/InstagramFeed";
import QuickLinks from "@/components/home/QuickLinks";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import SectionHeading from "@/components/ui/SectionHeading";
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
        <section className="bg-base text-cream py-16 grain-overlay torn-edge torn-edge-reverse">
          <div className="max-w-5xl mx-auto px-6">
            <SectionHeading dark subtitle="What's happening at the store">
              Latest News
            </SectionHeading>
            <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
              {latestNews.map((post) => (
                <div key={post.id} className="bg-card text-cream p-6 rounded-sm border border-white/5 hover:border-brick/30 transition-colors">
                  <h3 className="font-heading text-xl uppercase tracking-tight">
                    {post.title}
                  </h3>
                  <p className="mt-2 font-mono text-xs text-gold uppercase">
                    {post.publishedAt.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-3 text-cream/70 text-sm line-clamp-3 font-sans">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <InstagramFeed />

      <section className="bg-base text-cream py-12 px-6 grain-overlay">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl uppercase tracking-tight">Stay in the Loop</h2>
          <p className="mt-3 text-lg text-cream/70 max-w-xl mx-auto font-sans">
            New arrivals, events, and community news delivered to your inbox.
          </p>
          <div className="mt-8 flex justify-center">
            <NewsletterSignup />
          </div>
        </div>
      </section>

      <QuickLinks />
    </>
  );
}
