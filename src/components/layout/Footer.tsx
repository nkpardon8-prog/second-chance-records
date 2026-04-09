import Link from "next/link";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import ExternalLink from "@/components/ui/ExternalLink";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-primary)] text-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="font-heading text-xl font-bold mb-4">Stay in the Loop</h3>
            <p className="text-sm text-[var(--color-background)]/70 mb-4">
              New arrivals, events, and community news delivered to your inbox.
            </p>
            <NewsletterSignup />
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">Visit Us</h3>
            <address className="not-italic text-sm leading-relaxed text-[var(--color-background)]/80">
              <p>5744 E Burnside St, Suite 104</p>
              <p>Portland, OR 97215</p>
              <p className="mt-2">
                <a href="tel:+15039972729" className="hover:text-[var(--color-accent)] transition-colors">(503) 997-2729</a>
              </p>
              <p>
                <a href="mailto:hello@secondchancerecords.com" className="hover:text-[var(--color-accent)] transition-colors">
                  hello@secondchancerecords.com
                </a>
              </p>
            </address>
            <div className="mt-3 text-sm text-[var(--color-background)]/70">
              <p>Thu - Sun: 12pm - 8pm</p>
              <p>Mon - Wed: Closed</p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">Connect</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <ExternalLink href="https://www.instagram.com/secondchancerecords" className="hover:text-[var(--color-accent)] transition-colors">
                  Instagram
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://www.facebook.com/secondchancerecords" className="hover:text-[var(--color-accent)] transition-colors">
                  Facebook
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://www.discogs.com/seller/secondchancerecords" className="hover:text-[var(--color-accent)] transition-colors">
                  Discogs
                </ExternalLink>
              </li>
            </ul>

            <div className="mt-6">
              <Link href="/visit" className="text-sm hover:text-[var(--color-accent)] transition-colors">
                Get Directions &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--color-background)]/20 text-center text-xs text-[var(--color-background)]/50">
          &copy; 2025 Second Chance Records. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
