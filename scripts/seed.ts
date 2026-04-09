import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import {
  users,
  siteSettings,
  pageContent,
  events,
  news,
  featuredRecords,
  reviews,
  partners,
  communityResources,
  subscribers,
  contactSubmissions,
  instagramPosts,
} from "../src/lib/db/schema";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sqlClient = neon(databaseUrl);
  const db = drizzle(sqlClient);

  console.log("Clearing existing data...");
  await db.delete(contactSubmissions);
  await db.delete(subscribers);
  await db.delete(instagramPosts);
  await db.delete(communityResources);
  await db.delete(partners);
  await db.delete(reviews);
  await db.delete(featuredRecords);
  await db.delete(news);
  await db.delete(events);
  await db.delete(pageContent);
  await db.delete(siteSettings);
  await db.delete(users);
  console.log("Existing data cleared.");

  // Users
  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await db.insert(users).values([
    { email: "nick@integrateapi.com", name: "Nick", passwordHash },
    { email: "secondchancerecords@gmail.com", name: "Tasha", passwordHash },
  ]);
  console.log("Users seeded.");

  // Site Settings
  console.log("Seeding site settings...");
  await db.insert(siteSettings).values([
    { key: "store_name", value: "Second Chance Records", label: "Store Name", group: "general" },
    { key: "tagline", value: "Second chances for humans & hi-fi", label: "Tagline", group: "general" },
    { key: "address", value: "5744 E Burnside St, Suite 104, Portland, OR 97215", label: "Address", group: "contact" },
    { key: "phone", value: "(503) 997-2729", label: "Phone", group: "contact" },
    { key: "email", value: "secondchancerecords@gmail.com", label: "Email", group: "contact" },
    { key: "hours", value: "Thursday\u2013Sunday, Noon\u20138 PM", label: "Hours", group: "hours" },
    { key: "hours_detail", value: "Closed Monday\u2013Wednesday", label: "Hours Detail", group: "hours" },
    { key: "instagram", value: "https://instagram.com/second_chance_recordspdx", label: "Instagram", group: "social" },
    { key: "facebook", value: "https://facebook.com/people/Second-Chance-Records/61577516711735/", label: "Facebook", group: "social" },
    { key: "discogs", value: "https://www.discogs.com/seller/SecondChance_Records/profile", label: "Discogs", group: "social" },
    { key: "yelp", value: "https://www.yelp.com/biz/second-chance-records-portland", label: "Yelp", group: "social" },
    { key: "google_maps_embed", value: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2795.5!2d-122.5934!3d45.5231!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDMxJzIzLjIiTiAxMjLCsDM1JzM2LjIiVw!5e0!3m2!1sen!2sus!4v1", label: "Google Maps Embed URL", group: "contact" },
  ]);
  console.log("Site settings seeded.");

  // Page Content
  console.log("Seeding page content...");
  await db.insert(pageContent).values([
    { pageSlug: "home", sectionKey: "hero_title", content: "Second Chance Records", sortOrder: 0 },
    { pageSlug: "home", sectionKey: "hero_subtitle", content: "Second chances for humans & hi-fi", sortOrder: 1 },
    { pageSlug: "home", sectionKey: "hero_description", content: "A used record store in Portland's Mt. Tabor neighborhood. Every record cleaned, listened to, and given a fresh start.", sortOrder: 2 },
    { pageSlug: "about", sectionKey: "main_title", content: "About Second Chance Records", sortOrder: 0 },
    { pageSlug: "about", sectionKey: "story", content: "Second Chance Records opened in July 2025 in Portland's Mt. Tabor neighborhood. Owner Tasha Brain personally curates every item in the store's inventory. Each record goes through a meticulous restoration process: first cleaned with a Spin-Clean manual washing system, then with a HumminGuru ultrasonic cleaner. Every disc is listened to, placed in a fresh inner sleeve, with condition notes marked on the price sticker.", sortOrder: 1 },
    { pageSlug: "about", sectionKey: "tasha_story", content: "The name 'Second Chance' carries a double meaning. Beyond restoring records, Tasha is a passionate advocate for second chances for people. Having celebrated 15 years of freedom since her parole date on May 19, 2010, Tasha uses her platform to advocate for prison reform, successful reentry programs, second chance employment, and automatic expungement opportunities.", sortOrder: 2 },
    { pageSlug: "about", sectionKey: "press_title", content: "In the Press", sortOrder: 3 },
    { pageSlug: "mission", sectionKey: "main_title", content: "Mission & Values", sortOrder: 0 },
    { pageSlug: "mission", sectionKey: "statement", content: "We believe in second chances \u2014 for records and for people. Second Chance Records exists to restore dignity, purpose, and opportunity to things and people who have been overlooked.", sortOrder: 1 },
    { pageSlug: "mission", sectionKey: "advocacy", content: "Tasha Brain is passionate about prison reform, successful reentry programs, second chance employment, and automatic expungement. She has spread hope, employment opportunities, and resources inside Eastern Oregon Correctional Institution and Two Rivers Correctional Institution.", sortOrder: 2 },
    { pageSlug: "mission", sectionKey: "resources_title", content: "Community Resources", sortOrder: 3 },
    { pageSlug: "shop", sectionKey: "main_title", content: "Shop Our Records", sortOrder: 0 },
    { pageSlug: "shop", sectionKey: "description", content: "Browse our curated collection on Discogs. Every record has been carefully cleaned, inspected, and graded.", sortOrder: 1 },
    { pageSlug: "events", sectionKey: "main_title", content: "Events", sortOrder: 0 },
    { pageSlug: "events", sectionKey: "description", content: "Check out what's happening at Second Chance Records. From live music to community gatherings, there's always something spinning.", sortOrder: 1 },
    { pageSlug: "visit", sectionKey: "main_title", content: "Visit Us", sortOrder: 0 },
    { pageSlug: "visit", sectionKey: "description", content: "We're located in a charming business suite in Portland's Mt. Tabor neighborhood, alongside Coplin Architecture and Artisan Woodworking & Design.", sortOrder: 1 },
    { pageSlug: "visit", sectionKey: "parking", content: "Street parking available on E Burnside St. The shop is wheelchair accessible with accessible parking near the entrance.", sortOrder: 2 },
    { pageSlug: "contact", sectionKey: "main_title", content: "Get in Touch", sortOrder: 0 },
    { pageSlug: "contact", sectionKey: "description", content: "Have a question? Looking for a specific record? Drop us a line.", sortOrder: 1 },
    { pageSlug: "reviews", sectionKey: "main_title", content: "What People Are Saying", sortOrder: 0 },
    { pageSlug: "reviews", sectionKey: "description", content: "Hear from our customers about their experience at Second Chance Records.", sortOrder: 1 },
    { pageSlug: "community", sectionKey: "main_title", content: "Community & Partners", sortOrder: 0 },
    { pageSlug: "community", sectionKey: "description", content: "Second Chance Records is proud to be part of Portland's vibrant community.", sortOrder: 1 },
  ]);
  console.log("Page content seeded.");

  // Community Resources
  console.log("Seeding community resources...");
  await db.insert(communityResources).values([
    { name: "Oregon Justice Resource Center", url: "https://www.ojrc.info/", description: "The only organization in Oregon involved in all non-prosecutorial aspects of the criminal justice system, from arrest through reentry.", sortOrder: 0 },
    { name: "Fresh Out Community-Based Reentry Program", url: "https://freshoutcbrp.org/", description: "Founded by formerly incarcerated individuals. Provides bus fare, food, clothing, and mentoring.", sortOrder: 1 },
    { name: "Northwest Regional Reentry Center", url: "https://nw-rrc.org/", description: "Partners with Oregon Health Authority and all 36 counties for job training, counseling, and accountability.", sortOrder: 2 },
    { name: "SE Works / PDX Reentry", url: "https://seworks.org/ex-offenders/", description: "Justice-involved employment programs through WorkSource Oregon.", sortOrder: 3 },
    { name: "211info Reentry Programs", url: "https://www.211info.org/get-help/employment/ex-offender-reentry-programs/", description: "Portland-area reentry resource directory including expungement and legal clinics.", sortOrder: 4 },
    { name: "Oregon Corrections Enterprises Reentry", url: "https://oce.oregon.gov/reentry/", description: "State-level reentry programming through Oregon Corrections Enterprises.", sortOrder: 5 },
  ]);
  console.log("Community resources seeded.");

  // Partners
  console.log("Seeding partners...");
  await db.insert(partners).values([
    { name: "Portland Cherry Bombs FC", url: "https://www.cherrybombsfc.com/", description: "A women's pre-professional soccer team in USL W League with a punk/riot grrrl aesthetic. Community-focused partners with Unite Oregon and Oregon Food Bank.", sortOrder: 0 },
  ]);
  console.log("Partners seeded.");

  // Reviews
  console.log("Seeding reviews...");
  await db.insert(reviews).values([
    { author: "Portland Vinyl Lover", platform: "google", rating: 5, quote: "Such a cozy little shop! Tasha is incredibly knowledgeable and every record is in great condition. Love the mission behind this place.", sortOrder: 0 },
    { author: "Record Digger PDX", platform: "yelp", rating: 5, quote: "Best kept secret in Mt. Tabor. The records are priced fairly and cleaned beautifully. The story behind the shop makes it even better.", sortOrder: 1 },
    { author: "Music Fan", platform: "google", rating: 5, quote: "A welcoming space with a thoughtfully curated collection. You can tell every record has been cared for.", sortOrder: 2 },
  ]);
  console.log("Reviews seeded.");

  // Featured Records
  console.log("Seeding featured records...");
  await db.insert(featuredRecords).values([
    { title: "Check Our Latest Arrivals", category: "new_arrivals", discogsUrl: "https://www.discogs.com/seller/SecondChance_Records/profile", description: "Fresh finds added weekly. Each one cleaned and inspected.", sortOrder: 0 },
    { title: "Staff Picks This Month", category: "staff_picks", discogsUrl: "https://www.discogs.com/seller/SecondChance_Records/profile", description: "Tasha's current favorites from the bins.", sortOrder: 1 },
    { title: "Local Portland Artists", category: "local_artists", discogsUrl: "https://www.discogs.com/seller/SecondChance_Records/profile", description: "Supporting Portland's music community.", sortOrder: 2 },
  ]);
  console.log("Featured records seeded.");

  // Events
  console.log("Seeding events...");
  await db.insert(events).values([
    { title: "Vinyl & Vibes Night", date: "2026-05-01", time: "6:00 PM", description: "Join us for an evening of music and community. Bring your own records to share!", source: "manual", isPublished: true, sortOrder: 0 },
    { title: "Record Store Day 2026", date: "2026-04-18", time: "12:00 PM", description: "Celebrate Record Store Day with special releases, live music, and exclusive deals all day long.", source: "manual", isPublished: true, sortOrder: 1 },
    { title: "Local Artists Showcase", date: "2026-05-15", time: "5:00 PM", description: "Featuring vinyl from Portland's own musicians. Meet the artists and discover new local sounds.", artistName: "Various Portland Artists", source: "manual", isPublished: true, sortOrder: 2 },
  ]);
  console.log("Events seeded.");

  // News
  console.log("Seeding news...");
  await db.insert(news).values([
    { title: "Welcome to Second Chance Records Online!", content: "We're excited to launch our new website! Browse our collection on Discogs, check out upcoming events, and learn about our mission. Whether you're a vinyl veteran or just getting started, there's a second chance waiting for you.", isPublished: true },
  ]);
  console.log("News seeded.");

  console.log("Seed complete! All data inserted successfully.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
