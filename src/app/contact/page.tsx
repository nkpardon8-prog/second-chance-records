import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Second Chance Records",
  description:
    "Get in touch with Second Chance Records. Questions about vinyl, events, or community partnerships? We'd love to hear from you.",
  openGraph: {
    title: "Contact | Second Chance Records",
    description:
      "Get in touch with Second Chance Records in Portland, OR.",
  },
};

export default function ContactPage() {
  return (
    <div className="bg-kraft min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <SectionHeading subtitle="We'd love to hear from you">
          Contact Us
        </SectionHeading>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          <div className="space-y-6">
            <div className="bg-card text-cream p-8 rounded-sm">
              <h3 className="font-heading text-lg uppercase tracking-tight mb-3">
                Store Info
              </h3>
              <address className="not-italic font-mono text-sm text-cream/70 leading-relaxed space-y-2">
                <p>5744 E Burnside St, Suite 104</p>
                <p>Portland, OR 97215</p>
                <p>
                  <a href="tel:+15039972729" className="text-brick hover:text-gold transition-colors">
                    (503) 997-2729
                  </a>
                </p>
                <p>
                  <a href="mailto:hello@secondchancerecords.com" className="text-brick hover:text-gold transition-colors">
                    hello@secondchancerecords.com
                  </a>
                </p>
              </address>
            </div>

            <div className="bg-card text-cream p-8 rounded-sm">
              <h3 className="font-heading text-lg uppercase tracking-tight mb-3">
                Hours
              </h3>
              <div className="font-mono text-sm text-cream/70 space-y-1">
                <p>Thu - Sun: 12pm - 8pm</p>
                <p className="text-muted">Mon - Wed: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
