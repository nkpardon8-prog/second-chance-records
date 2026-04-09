import Link from "next/link";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import ExternalLink from "@/components/ui/ExternalLink";

export default function Footer() {
  return (
    <footer className="bg-base text-cream border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Newsletter */}
        <div className="mb-12 max-w-xl">
          <h3 className="font-heading text-2xl mb-2">Stay in the Loop</h3>
          <p className="text-sm text-cream/70 mb-4 font-sans">
            New arrivals, events, and community news delivered to your inbox.
          </p>
          <NewsletterSignup />
        </div>

        {/* Three-column grid */}
        <div className="grid gap-10 md:grid-cols-3">
          {/* Contact */}
          <div>
            <h4 className="font-mono uppercase text-xs tracking-wider text-muted mb-4">Contact</h4>
            <address className="not-italic font-mono text-sm leading-relaxed text-cream/70">
              <p>5744 E Burnside St, Suite 104</p>
              <p>Portland, OR 97215</p>
              <p className="mt-2">
                <a href="tel:+15039972729" className="hover:text-brick transition-colors">(503) 997-2729</a>
              </p>
              <p>
                <a href="mailto:hello@secondchancerecords.com" className="hover:text-brick transition-colors">
                  hello@secondchancerecords.com
                </a>
              </p>
            </address>
            <div className="mt-3 font-mono text-sm text-cream/70">
              <p>Thu - Sun: 12pm - 8pm</p>
              <p>Mon - Wed: Closed</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-mono uppercase text-xs tracking-wider text-muted mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/shop" className="text-cream/70 hover:text-brick transition-colors">Shop</Link></li>
              <li><Link href="/events" className="text-cream/70 hover:text-brick transition-colors">Events</Link></li>
              <li><Link href="/about" className="text-cream/70 hover:text-brick transition-colors">About</Link></li>
              <li><Link href="/mission" className="text-cream/70 hover:text-brick transition-colors">Mission</Link></li>
              <li><Link href="/visit" className="text-cream/70 hover:text-brick transition-colors">Visit</Link></li>
              <li><Link href="/contact" className="text-cream/70 hover:text-brick transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-mono uppercase text-xs tracking-wider text-muted mb-4">Social</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <ExternalLink href="https://www.instagram.com/secondchancerecords" className="text-cream/70 hover:text-brick transition-colors">
                  Instagram
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://www.facebook.com/secondchancerecords" className="text-cream/70 hover:text-brick transition-colors">
                  Facebook
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://www.discogs.com/seller/secondchancerecords" className="text-cream/70 hover:text-brick transition-colors">
                  Discogs
                </ExternalLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 text-center">
          <p className="font-accent text-gold text-sm mb-2">Second chances for humans &amp; hi-fi</p>
          <p className="text-muted text-xs">&copy; 2025 Second Chance Records. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
