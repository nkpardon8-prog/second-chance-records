import type { Metadata } from "next";
import { getSettingsByGroup } from "@/lib/actions/settings";
import SectionHeading from "@/components/ui/SectionHeading";
import GoogleMap from "@/components/visit/GoogleMap";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Visit | Second Chance Records",
  description:
    "Visit Second Chance Records at 5744 E Burnside St, Suite 104, Portland, OR 97215. Open Thu-Sun 12-8pm.",
  openGraph: {
    title: "Visit | Second Chance Records",
    description:
      "Find us at 5744 E Burnside St, Portland, OR. Open Thu-Sun 12-8pm.",
  },
};

export default async function VisitPage() {
  const settings = await getSettingsByGroup("store");

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const address = settingsMap["store_address"] || "5744 E Burnside St, Suite 104, Portland, OR 97215";
  const phone = settingsMap["store_phone"] || "(503) 997-2729";
  const hours = settingsMap["store_hours"] || "Thu - Sun: 12pm - 8pm";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading subtitle="Come say hi">
        Visit Us
      </SectionHeading>

      <div className="grid gap-8 lg:grid-cols-2 mb-12">
        <Card>
          <h3 className="font-heading text-xl font-bold text-[var(--color-primary)] mb-4">
            Store Info
          </h3>
          <address className="not-italic text-[var(--color-primary)]/70 leading-relaxed space-y-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-primary)]">Address</p>
              <p>{address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-primary)]">Phone</p>
              <p>
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-[var(--color-accent)] transition-colors">
                  {phone}
                </a>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-primary)]">Hours</p>
              <p>{hours}</p>
              <p className="text-sm text-[var(--color-primary)]/50">Mon - Wed: Closed</p>
            </div>
          </address>
        </Card>

        <Card>
          <h3 className="font-heading text-xl font-bold text-[var(--color-primary)] mb-4">
            Getting Here
          </h3>
          <div className="text-[var(--color-primary)]/70 space-y-3 text-sm">
            <p>
              We are located on East Burnside Street near 57th Avenue. Look for Suite 104.
            </p>
            <p>
              Free street parking is available on Burnside and surrounding side streets.
            </p>
            <p>
              TriMet Bus Line 20 stops within a block of the store.
            </p>
          </div>
          <div className="mt-6 aspect-square rounded-lg bg-[var(--color-primary)]/5 flex items-center justify-center">
            <p className="text-sm text-[var(--color-primary)]/40 italic">
              Building illustration coming soon
            </p>
          </div>
        </Card>
      </div>

      <GoogleMap />
    </div>
  );
}
