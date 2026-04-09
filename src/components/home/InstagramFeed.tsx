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
    <section className="bg-kraft py-16 px-6">
      <SectionHeading subtitle="Latest from our feed">
        Follow the Groove
      </SectionHeading>
      {posts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {posts.map((post) => (
            <ExternalLink
              key={post.id}
              href={post.permalink}
              className="block aspect-square overflow-hidden rounded-sm"
            >
              <img
                src={post.imageUrl}
                alt={post.caption?.slice(0, 80) || "Instagram post"}
                className="h-full w-full object-cover rounded-sm hover:opacity-80 transition-opacity"
                loading="lazy"
              />
            </ExternalLink>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-base/60 mb-4 font-sans">
            Follow us on Instagram for the latest updates!
          </p>
          <ExternalLink
            href="https://www.instagram.com/secondchancerecords"
            showIcon
            className="font-mono text-brick"
          >
            @secondchancerecords
          </ExternalLink>
        </div>
      )}
    </section>
  );
}
