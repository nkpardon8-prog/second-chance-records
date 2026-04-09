import { db } from "@/lib/db";
import { instagramPosts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import SectionHeading from "@/components/ui/SectionHeading";
import ExternalLink from "@/components/ui/ExternalLink";

export default async function InstagramFeed() {
  const posts = await db
    .select()
    .from(instagramPosts)
    .where(eq(instagramPosts.isVisible, true))
    .orderBy(desc(instagramPosts.postedAt))
    .limit(12);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="Latest from our feed">
        Instagram
      </SectionHeading>
      {posts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {posts.map((post) => (
            <ExternalLink
              key={post.id}
              href={post.permalink}
              className="group block aspect-square overflow-hidden rounded-lg"
            >
              <img
                src={post.imageUrl}
                alt={post.caption?.slice(0, 80) || "Instagram post"}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </ExternalLink>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[var(--color-primary)]/60 mb-4">
            Follow us on Instagram for the latest updates!
          </p>
          <ExternalLink
            href="https://www.instagram.com/secondchancerecords"
            showIcon
            className="text-[var(--color-accent)] font-medium hover:text-[var(--color-accent)]/80 transition-colors"
          >
            @secondchancerecords
          </ExternalLink>
        </div>
      )}
    </section>
  );
}
