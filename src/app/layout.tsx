import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Second Chance Records | Portland, OR",
  description:
    "Second Chance Records is a mission-driven vinyl record store in Portland, Oregon. Second chances for humans & hi-fi.",
  openGraph: {
    title: "Second Chance Records | Portland, OR",
    description:
      "Mission-driven vinyl record store in Portland, Oregon. Second chances for humans & hi-fi.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MusicStore",
  name: "Second Chance Records",
  description:
    "Mission-driven vinyl record store in Portland, Oregon. Second chances for humans & hi-fi.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "5744 E Burnside St, Suite 104",
    addressLocality: "Portland",
    addressRegion: "OR",
    postalCode: "97215",
    addressCountry: "US",
  },
  telephone: "(503) 997-2729",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Thursday", "Friday", "Saturday", "Sunday"],
      opens: "12:00",
      closes: "20:00",
    },
  ],
  sameAs: [
    "https://instagram.com/second_chance_recordspdx",
    "https://facebook.com/people/Second-Chance-Records/61577516711735/",
    "https://www.discogs.com/seller/SecondChance_Records/profile",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
