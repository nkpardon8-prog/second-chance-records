import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import ContactForm from "@/components/contact/ContactForm";
import Card from "@/components/ui/Card";

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
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="We'd love to hear from you">
        Contact Us
      </SectionHeading>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <ContactForm />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-heading text-lg font-bold text-[var(--color-primary)] mb-3">
              Store Info
            </h3>
            <address className="not-italic text-sm text-[var(--color-primary)]/70 leading-relaxed space-y-2">
              <p>5744 E Burnside St, Suite 104</p>
              <p>Portland, OR 97215</p>
              <p>
                <a href="tel:+15039972729" className="hover:text-[var(--color-accent)] transition-colors">
                  (503) 997-2729
                </a>
              </p>
              <p>
                <a href="mailto:hello@secondchancerecords.com" className="hover:text-[var(--color-accent)] transition-colors">
                  hello@secondchancerecords.com
                </a>
              </p>
            </address>
          </Card>

          <Card>
            <h3 className="font-heading text-lg font-bold text-[var(--color-primary)] mb-3">
              Hours
            </h3>
            <div className="text-sm text-[var(--color-primary)]/70 space-y-1">
              <p>Thu - Sun: 12pm - 8pm</p>
              <p>Mon - Wed: Closed</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
