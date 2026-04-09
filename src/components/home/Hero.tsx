import Link from "next/link";
import ExternalLink from "@/components/ui/ExternalLink";
import InlineEditor from "@/components/admin/InlineEditor";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-base text-cream grain-overlay flex items-center torn-edge overflow-hidden">
      {/* Mt. Tabor background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/mt-tabor.jpg')" }}
      />
      <div className="absolute inset-0 bg-base/70" />
      <div className="max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
        <h1 className="font-heading text-7xl md:text-8xl lg:text-9xl tracking-tight leading-none uppercase">
          Second Chance Records
        </h1>
        <InlineEditor pageSlug="home" sectionKey="hero-tagline" content="Second chances for humans &amp; hi-fi">
          <p className="font-accent text-xl md:text-2xl text-gold mt-4">
            Second chances for humans &amp; hi-fi
          </p>
        </InlineEditor>
        <InlineEditor pageSlug="home" sectionKey="hero-description" content="A mission-driven vinyl record store in Portland, Oregon. We restore records and support our community.">
          <p className="font-sans text-cream/90 text-lg max-w-2xl mx-auto mt-6">
            A mission-driven vinyl record store in Portland, Oregon. We restore records and support our community.
          </p>
        </InlineEditor>
        <div className="flex flex-wrap gap-4 justify-center mt-10">
          <ExternalLink
            href="https://www.discogs.com/seller/SecondChance_Records/profile"
            className="bg-brick text-cream hover:bg-brick/90 font-mono uppercase text-sm tracking-wider px-7 py-3 rounded-sm"
          >
            Shop on Discogs
          </ExternalLink>
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-sm border-2 border-cream/30 px-7 py-3 font-mono uppercase text-sm tracking-wider text-cream transition-colors hover:bg-cream/10"
          >
            Upcoming Events
          </Link>
          <Link
            href="/visit"
            className="inline-flex items-center justify-center rounded-sm border-2 border-cream/30 px-7 py-3 font-mono uppercase text-sm tracking-wider text-cream transition-colors hover:bg-cream/10"
          >
            Visit Us
          </Link>
        </div>
      </div>
    </section>
  );
}
