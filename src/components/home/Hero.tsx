import Link from "next/link";
import ExternalLink from "@/components/ui/ExternalLink";
import InlineEditor from "@/components/admin/InlineEditor";

interface HeroProps {
  heading: string;
  tagline: string;
  description: string;
}

export default function Hero({ heading, tagline, description }: HeroProps) {
  return (
    <section className="relative min-h-screen bg-base text-cream grain-overlay flex items-center torn-edge overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/mt-tabor.jpg')" }}
      />
      <div className="absolute inset-0 bg-base/70" />
      <div className="max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
        <InlineEditor pageSlug="home" sectionKey="hero-heading" content={heading}>
          <h1 className="mx-auto max-w-full text-center font-heading text-5xl leading-tight uppercase md:text-[clamp(3rem,5.6vw,5rem)] md:whitespace-nowrap">
            {heading}
          </h1>
        </InlineEditor>
        <InlineEditor pageSlug="home" sectionKey="hero-tagline" content={tagline}>
          <p className="font-accent text-xl md:text-2xl text-gold mt-4">
            {tagline}
          </p>
        </InlineEditor>
        <InlineEditor pageSlug="home" sectionKey="hero-description" content={description}>
          <p className="mt-6 mx-auto max-w-2xl text-lg font-sans text-cream/90 whitespace-pre-line">
            {description}
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
