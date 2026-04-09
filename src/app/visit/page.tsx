import type { Metadata } from "next";
import { getSettingsByGroup } from "@/lib/actions/settings";
import SectionHeading from "@/components/ui/SectionHeading";
import GoogleMap from "@/components/visit/GoogleMap";

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
    <div className="bg-kraft min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <SectionHeading subtitle="Come say hi">
          Visit Us
        </SectionHeading>

        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          <div className="bg-card text-cream p-8 rounded-sm border border-white/5">
            <h3 className="font-heading text-xl uppercase tracking-tight mb-4">
              Store Info
            </h3>
            <address className="not-italic text-cream/70 leading-relaxed space-y-3 font-sans">
              <div>
                <p className="font-mono text-xs text-gold uppercase tracking-wider">Address</p>
                <p>{address}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-gold uppercase tracking-wider">Phone</p>
                <p>
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-brick hover:text-gold transition-colors">
                    {phone}
                  </a>
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-gold uppercase tracking-wider">Hours</p>
                <p className="font-mono text-sm">{hours}</p>
                <p className="font-mono text-xs text-muted">Mon - Wed: Closed</p>
              </div>
            </address>
          </div>

          <div className="bg-card text-cream p-8 rounded-sm border border-white/5">
            <h3 className="font-heading text-xl uppercase tracking-tight mb-4">
              Getting Here
            </h3>
            <div className="text-cream/70 space-y-3 text-sm font-sans">
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
          </div>
        </div>

        <GoogleMap />
      </div>
    </div>
  );
}
