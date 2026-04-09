import Link from "next/link";
import ExternalLink from "@/components/ui/ExternalLink";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative bg-[var(--color-primary)] text-[var(--color-background)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/80" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Second Chance Records
          </h1>
          <p className="mt-4 text-xl text-[var(--color-background)]/80 sm:text-2xl font-heading italic">
            Second chances for humans &amp; hi-fi
          </p>
          <p className="mt-6 text-lg text-[var(--color-background)]/70 max-w-xl">
            A mission-driven vinyl record store in Portland, Oregon. We restore records and support our community.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ExternalLink
              href="https://www.discogs.com/seller/SecondChance_Records/profile"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-7 py-3 text-lg font-medium text-[var(--color-white)] transition-colors hover:bg-[var(--color-accent)]/90"
            >
              Shop on Discogs
            </ExternalLink>
            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-background)]/30 px-7 py-3 text-lg font-medium text-[var(--color-background)] transition-colors hover:bg-[var(--color-background)]/10"
            >
              Upcoming Events
            </Link>
            <Link
              href="/visit"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[var(--color-background)]/30 px-7 py-3 text-lg font-medium text-[var(--color-background)] transition-colors hover:bg-[var(--color-background)]/10"
            >
              Visit Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
