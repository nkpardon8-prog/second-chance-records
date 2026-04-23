import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Mono, Work_Sans, Special_Elite } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";
import { getSession } from "@/lib/auth";
import { AdminProvider } from "@/components/context/AdminContext";
import "./globals.css";

const myUnderwood = localFont({
  src: "../../public/fonts/my-underwood.ttf",
  variable: "--font-my-underwood",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

const specialElite = Special_Elite({
  weight: "400",
  variable: "--font-special-elite",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Second Chance Records | Portland, OR",
  description:
    "Second Chance Records is a mission-driven vinyl record store in Portland's Mt. Tabor neighborhood. Second chances for humans & hi-fi.",
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
    streetAddress: "5744 E Burnside St",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isAdmin = session.isLoggedIn === true;

  return (
    <html
      lang="en"
      className={`${myUnderwood.variable} ${spaceMono.variable} ${workSans.variable} ${specialElite.variable} h-full antialiased`}
    >
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
      <body className="min-h-full flex flex-col bg-kraft text-base font-sans">
        <AdminProvider isAdmin={isAdmin}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <BackToTop />
        </AdminProvider>
      </body>
    </html>
  );
}
