# Plan: Second Chance Records — Production Website

> **Brief:** `./tmp/briefs/2026-04-08-second-chance-records-website.md`
> **Research:** `./tmp/research/2026-04-08-second-chance-records-research.md`
> **Confidence:** 8/10

---

## Architecture Overview

A full-stack Next.js 15 application with App Router. Public-facing pages serve Second Chance Records' storefront and brand. An authenticated admin dashboard (`/admin/*`) allows content editing for all pages, event/news/review management, and newsletter subscriber management. Two automated integrations run on daily schedules: Perplexity Sonar Pro discovers new events, and Apify scrapes Instagram posts for the homepage feed.

**Data flow:**
- Public pages → Server Components → Drizzle queries → Netlify DB (Postgres via Neon)
- Admin pages → Server Component (fetches data) → Client Component (forms/interaction) → Server Actions → Drizzle → Netlify DB
- Auth → `iron-session` encrypted cookies (2 users only — simpler than Auth.js, which was in the brief but explicitly replaced for this use case)
- Contact form → Server Action → stores in DB (admin views submissions)
- Newsletter → API route → stores email in `subscribers` table
- Instagram feed → Apify daily scrape → download images to Cloudinary → store in `instagramPosts` table → render on homepage
- Event discovery → Perplexity Sonar Pro daily search → parse structured JSON → insert as draft events → admin reviews/publishes

**Why Netlify DB (Postgres via Neon):** Built into Netlify — no external accounts needed. Free on all plans (0.5GB storage, 100 CU-hours/month — more than enough). Auto-provisions via `@netlify/neon` package. Uses Drizzle ORM with `drizzle-orm/neon-http` driver. Local dev uses `netlify dev` which connects to the same Neon instance, or we can use a local Postgres via Docker for offline dev.

**Why `iron-session` instead of Auth.js (deviates from brief):** Only 2 admin users (Nick + Tasha). `iron-session` stores encrypted session data directly in a cookie — no session table, no OAuth complexity, no JWT strategy gotchas. One dependency, ~50 lines of auth code. Auth.js Credentials provider has known friction with database sessions and is overkill here.

**Why Cloudinary for images:** Instagram CDN URLs expire within hours. Admin also needs image hosting for events/records/news. Cloudinary free tier (25GB storage, 25K transformations/month) handles both: Apify scraper downloads IG images → uploads to Cloudinary, and admin can upload images via Cloudinary widget or paste URLs.

---

## Files Being Changed

```
second-chance-records/
├── .env.local                          ← NEW (env vars, not committed)
├── .env.example                        ← NEW (committed template, no secrets)
├── .gitignore                          ← NEW
├── netlify.toml                        ← NEW (Netlify build config + scheduled functions)
├── next.config.ts                      ← NEW
├── tailwind.config.ts                  ← NEW
├── tsconfig.json                       ← NEW
├── package.json                        ← NEW
├── drizzle.config.ts                   ← NEW
├── postcss.config.ts                   ← NEW
│
├── public/
│   ├── images/
│   │   ├── placeholder-hero.jpg        ← NEW (placeholder)
│   │   ├── placeholder-logo.svg        ← NEW (placeholder open cell door)
│   │   ├── placeholder-store.jpg       ← NEW (placeholder)
│   │   └── placeholder-tasha.jpg       ← NEW (placeholder)
│   └── favicon.ico                     ← NEW
│
├── netlify/
│   └── functions/
│       ├── sync-events.mts             ← NEW (Netlify Scheduled Function — Perplexity Sonar)
│       └── sync-instagram.mts          ← NEW (Netlify Scheduled Function — Apify + Cloudinary)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  ← NEW (root layout: header, footer, back-to-top, analytics)
│   │   ├── page.tsx                    ← NEW (Home)
│   │   ├── not-found.tsx               ← NEW (custom 404)
│   │   ├── error.tsx                   ← NEW (custom error boundary)
│   │   ├── globals.css                 ← NEW (Tailwind base + CSS custom properties)
│   │   ├── about/page.tsx              ← NEW
│   │   ├── shop/page.tsx               ← NEW
│   │   ├── events/page.tsx             ← NEW
│   │   ├── mission/page.tsx            ← NEW (Mission & Values)
│   │   ├── visit/page.tsx              ← NEW
│   │   ├── contact/page.tsx            ← NEW
│   │   ├── reviews/page.tsx            ← NEW
│   │   ├── community/page.tsx          ← NEW (Social & Partners)
│   │   │
│   │   ├── api/
│   │   │   ├── newsletter/route.ts     ← NEW (newsletter signup — API route for fetch from client)
│   │   │   └── admin/
│   │   │       └── subscribers/
│   │   │           └── export/route.ts ← NEW (CSV export)
│   │   │
│   │   └── admin/
│   │       ├── layout.tsx              ← NEW (admin layout, auth gate via Server Component)
│   │       ├── page.tsx                ← NEW (admin dashboard home)
│   │       ├── login/page.tsx          ← NEW (login form)
│   │       ├── pages/
│   │       │   └── [slug]/page.tsx     ← NEW (edit page content by slug)
│   │       ├── events/page.tsx         ← NEW (manage events — includes auto-discovered drafts)
│   │       ├── news/page.tsx           ← NEW (manage news posts)
│   │       ├── records/page.tsx        ← NEW (manage featured records)
│   │       ├── reviews/page.tsx        ← NEW (manage reviews)
│   │       ├── partners/page.tsx       ← NEW (manage partners)
│   │       ├── resources/page.tsx      ← NEW (manage community resources)
│   │       ├── subscribers/page.tsx    ← NEW (newsletter subscribers)
│   │       ├── contact-submissions/page.tsx ← NEW (view contact form submissions)
│   │       ├── instagram/page.tsx      ← NEW (manage Instagram feed — view synced posts, trigger sync)
│   │       └── settings/page.tsx       ← NEW (site settings: hours, phone, socials)
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts               ← NEW (Drizzle client)
│   │   │   └── schema.ts              ← NEW (all table definitions)
│   │   ├── auth.ts                     ← NEW (iron-session config + helpers — Server Components/Actions only)
│   │   ├── cloudinary.ts               ← NEW (Cloudinary upload helper)
│   │   ├── perplexity.ts               ← NEW (Sonar Pro client + event parsing)
│   │   ├── apify.ts                    ← NEW (Apify Instagram scraper client)
│   │   ├── validations/
│   │   │   ├── event.ts                ← NEW (Zod schema for events)
│   │   │   ├── news.ts                 ← NEW (Zod schema for news)
│   │   │   ├── record.ts              ← NEW (Zod schema for featured records)
│   │   │   ├── review.ts              ← NEW (Zod schema for reviews)
│   │   │   ├── partner.ts             ← NEW (Zod schema for partners)
│   │   │   ├── resource.ts            ← NEW (Zod schema for community resources)
│   │   │   ├── contact.ts             ← NEW (Zod schema for contact form)
│   │   │   └── settings.ts            ← NEW (Zod schema for site settings)
│   │   └── actions/
│   │       ├── auth.ts                 ← NEW (login/logout server actions)
│   │       ├── content.ts              ← NEW (page content CRUD)
│   │       ├── events.ts               ← NEW (events CRUD)
│   │       ├── news.ts                 ← NEW (news CRUD)
│   │       ├── records.ts              ← NEW (featured records CRUD)
│   │       ├── reviews.ts              ← NEW (reviews CRUD)
│   │       ├── partners.ts             ← NEW (partners CRUD)
│   │       ├── resources.ts            ← NEW (community resources CRUD)
│   │       ├── subscribers.ts          ← NEW (subscriber management)
│   │       ├── contact.ts              ← NEW (contact form handling)
│   │       ├── settings.ts             ← NEW (site settings CRUD)
│   │       └── instagram.ts            ← NEW (Instagram posts management)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx              ← NEW (responsive nav)
│   │   │   ├── Footer.tsx              ← NEW (newsletter signup, contact info, social links)
│   │   │   ├── BackToTop.tsx           ← NEW (floating button)
│   │   │   └── MobileMenu.tsx          ← NEW (mobile hamburger menu)
│   │   ├── ui/
│   │   │   ├── Button.tsx              ← NEW
│   │   │   ├── Card.tsx                ← NEW
│   │   │   ├── Input.tsx               ← NEW
│   │   │   ├── Textarea.tsx            ← NEW
│   │   │   ├── ExternalLink.tsx        ← NEW (target="_blank" + rel attrs)
│   │   │   └── SectionHeading.tsx      ← NEW
│   │   ├── home/
│   │   │   ├── Hero.tsx                ← NEW
│   │   │   ├── FeaturedRecords.tsx     ← NEW
│   │   │   ├── InstagramFeed.tsx       ← NEW (mirrored IG posts grid)
│   │   │   ├── NewsletterSignup.tsx    ← NEW
│   │   │   └── QuickLinks.tsx          ← NEW
│   │   ├── shop/
│   │   │   └── DiscogsSection.tsx      ← NEW
│   │   ├── events/
│   │   │   └── EventCard.tsx           ← NEW
│   │   ├── reviews/
│   │   │   └── ReviewCard.tsx          ← NEW
│   │   ├── visit/
│   │   │   └── GoogleMap.tsx           ← NEW
│   │   ├── contact/
│   │   │   └── ContactForm.tsx         ← NEW
│   │   └── admin/
│   │       ├── AdminSidebar.tsx        ← NEW
│   │       ├── ContentEditor.tsx       ← NEW (plain textarea editor for page sections)
│   │       ├── SortableList.tsx        ← NEW (reorderable list + "Save Order" button)
│   │       ├── ItemForm.tsx            ← NEW (generic add/edit form)
│   │       └── DataTable.tsx           ← NEW (table for subscribers, submissions)
│   │
│   ├── middleware.ts                   ← NEW (protect /admin/* routes — imports sessionOptions from auth.ts)
│   │
│   └── types/
│       └── index.ts                    ← NEW (shared TypeScript types)
│
└── scripts/
    └── seed.ts                         ← NEW (runnable seed script)
```

---

## Database Schema

```typescript
// src/lib/db/schema.ts
import { pgTable, serial, text, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";

// Admin users (seeded, not self-registration)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

// Key-value site settings (hours, phone, address, social URLs)
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  group: varchar("group", { length: 50 }).notNull(), // "contact", "hours", "social", "general"
});

// Editable content blocks for each page
export const pageContent = pgTable("page_content", {
  id: serial("id").primaryKey(),
  pageSlug: varchar("page_slug", { length: 100 }).notNull(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  contentType: varchar("content_type", { length: 20 }).notNull().default("text"),
  content: text("content").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Events (manual + auto-discovered via Perplexity)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  date: varchar("date", { length: 10 }).notNull(),   // YYYY-MM-DD
  time: varchar("time", { length: 20 }),
  artistName: varchar("artist_name", { length: 300 }),
  artistUrl: text("artist_url"),
  imageUrl: text("image_url"),
  sourceUrl: text("source_url"),          // where Perplexity found it (null if manual)
  source: varchar("source", { length: 20 }).notNull().default("manual"), // "manual" | "auto"
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// News posts
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Featured records (Discogs links)
export const featuredRecords = pgTable("featured_records", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  artist: varchar("artist", { length: 300 }),
  category: varchar("category", { length: 50 }).notNull(),
  discogsUrl: text("discogs_url").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Curated reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  author: varchar("author", { length: 200 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  rating: integer("rating"),
  quote: text("quote").notNull(),
  isFeatured: boolean("is_featured").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Partners
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: text("url").notNull(),
  logoUrl: text("logo_url"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Community resources (reentry orgs)
export const communityResources = pgTable("community_resources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Newsletter subscribers
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Contact form submissions
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 300 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Instagram posts (synced via Apify)
export const instagramPosts = pgTable("instagram_posts", {
  id: serial("id").primaryKey(),
  instagramId: varchar("instagram_id", { length: 100 }).notNull().unique(),
  imageUrl: text("image_url").notNull(),                // Cloudinary permanent URL
  caption: text("caption"),
  permalink: text("permalink").notNull(),                // Original IG post URL
  likesCount: integer("likes_count").default(0),
  postedAt: timestamp("posted_at").notNull(),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  isVisible: boolean("is_visible").notNull().default(true),
});
```

---

## Key Pseudocode

### Database Client (`src/lib/db/index.ts`)

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

`DATABASE_URL` is auto-set by Netlify when you provision Netlify DB. For local dev, `netlify dev` proxies the connection automatically. The `@netlify/neon` package re-exports `@neondatabase/serverless` and is auto-configured.

### Auth — Two Files

**`src/lib/auth.ts`** — shared config + Server Component/Action helper:
```typescript
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData { userId: number; email: string; name: string; isLoggedIn: boolean; }

// Shared config — used by both auth.ts and middleware.ts
export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "scr-admin-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};

// For Server Components and Server Actions ONLY (uses cookies() from next/headers)
export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
```

**Note:** Middleware CANNOT use `getSession()` because `cookies()` is not available in Edge runtime. Middleware imports `sessionOptions` and calls `getIronSession(request, response, sessionOptions)` directly using the request/response pattern. `auth-edge.ts` is removed — the middleware handles this inline.

### Middleware (`src/middleware.ts`)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") &&
      !request.nextUrl.pathname.startsWith("/admin/login")) {
    const response = NextResponse.next();
    const session = await getIronSession(request, response, sessionOptions);
    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```

### Login/Logout as Server Actions (`src/lib/actions/auth.ts`)

```typescript
"use server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const user = await db.select().from(users).where(eq(users.email, email)).then(rows => rows[0]);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.isLoggedIn = true;
  await session.save();
  redirect("/admin");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}
```

### Server Actions with Zod Validation

```typescript
// src/lib/actions/events.ts
"use server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eventSchema } from "@/lib/validations/event";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    time: formData.get("time"),
    artistName: formData.get("artistName"),
    artistUrl: formData.get("artistUrl"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.insert(events).values(parsed.data);
  revalidatePath("/events");
  revalidatePath("/admin/events");
}

// Batch reorder — single transaction, not N+1
export async function reorderEvents(orderedIds: number[]) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  // Use raw SQL with CASE WHEN for a single UPDATE statement
  const cases = orderedIds.map((id, i) => `WHEN id = ${id} THEN ${i}`).join(" ");
  await db.execute(
    sql`UPDATE events SET sort_order = CASE ${sql.raw(cases)} END WHERE id IN (${sql.join(orderedIds.map(id => sql`${id}`), sql`, `)})`
  );
  revalidatePath("/events");
  revalidatePath("/admin/events");
}
```

### Zod Validation Example

```typescript
// src/lib/validations/event.ts
import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  time: z.string().max(20).optional(),
  artistName: z.string().max(200).optional(),
  artistUrl: z.string().url().optional().or(z.literal("")),
});
```

### Admin Page Pattern — Server Component Wrapper

```typescript
// src/app/admin/events/page.tsx (Server Component — fetches data)
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import AdminEventsClient from "./AdminEventsClient";

export default async function AdminEventsPage() {
  const allEvents = await db.select().from(events).orderBy(asc(events.sortOrder));
  return <AdminEventsClient initialEvents={allEvents} />;
}

// src/app/admin/events/AdminEventsClient.tsx (Client Component — forms + reorder)
"use client";
import { createEvent, updateEvent, deleteEvent, reorderEvents } from "@/lib/actions/events";
import SortableList from "@/components/admin/SortableList";
// ... renders SortableList with "Save Order" button, ItemForm for add/edit
```

### Perplexity Sonar Pro — Event Discovery (`src/lib/perplexity.ts`)

```typescript
import OpenAI from "openai";

const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY!,
  baseURL: "https://api.perplexity.ai",
});

export async function discoverEvents(): Promise<DiscoveredEvent[]> {
  const response = await perplexity.chat.completions.create({
    model: "sonar-pro",
    messages: [
      {
        role: "system",
        content: `Search for upcoming events at Second Chance Records, a vinyl record store at 5744 E Burnside St, Portland OR. Return a JSON object with an "events" array. Each event should have: title (string), date (YYYY-MM-DD), time (string, optional), description (string), artist_name (string, optional), source_url (string). Only include events you are confident about. If no events found, return empty array.`,
      },
      {
        role: "user",
        content: "Find upcoming events at Second Chance Records Portland Oregon in the next 30 days",
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "events_response",
        schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  date: { type: "string" },
                  time: { type: "string" },
                  description: { type: "string" },
                  artist_name: { type: "string" },
                  source_url: { type: "string" },
                },
                required: ["title", "date", "description"],
              },
            },
          },
          required: ["events"],
        },
      },
    },
    search_recency_filter: "week",
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];
  return JSON.parse(content).events;
}
```

### Apify Instagram Scraper (`src/lib/apify.ts`)

```typescript
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });

export async function scrapeInstagramPosts(limit = 20) {
  const run = await client.actor("apify/instagram-scraper").call({
    directUrls: ["https://www.instagram.com/second_chance_recordspdx/"],
    resultsType: "posts",
    resultsLimit: limit,
  });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items.map((item: any) => ({
    instagramId: item.shortCode,
    imageUrl: item.displayUrl,       // Temporary IG CDN URL — must re-host
    caption: item.caption || "",
    permalink: item.url,
    likesCount: item.likesCount || 0,
    postedAt: item.timestamp,
  }));
}
```

### Cloudinary Upload Helper (`src/lib/cloudinary.ts`)

```typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadFromUrl(imageUrl: string, publicId: string): Promise<string> {
  const result = await cloudinary.uploader.upload(imageUrl, {
    public_id: `scr/instagram/${publicId}`,
    overwrite: false,
    transformation: [{ width: 800, height: 800, crop: "fill", quality: "auto" }],
  });
  return result.secure_url;
}
```

### Netlify Scheduled Functions

```typescript
// netlify/functions/sync-events.mts
// NOTE: Netlify Functions bundle independently from Next.js.
// All logic is inlined here — do NOT import from ../../src/lib/ as those
// paths may not resolve in the Netlify Functions bundler.
import type { Config } from "@netlify/functions";
import OpenAI from "openai";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, serial, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Inline schema (just the events table needed here)
const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 20 }),
  artistName: varchar("artist_name", { length: 300 }),
  sourceUrl: text("source_url"),
  source: varchar("source", { length: 20 }).notNull().default("manual"),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schema to validate Perplexity response
const discoveredEventSchema = z.object({
  title: z.string(),
  date: z.string(),
  description: z.string(),
  time: z.string().optional(),
  artist_name: z.string().optional(),
  source_url: z.string().optional(),
});
const eventsResponseSchema = z.object({ events: z.array(discoveredEventSchema) });

export default async function handler() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  // Call Perplexity Sonar Pro
  const perplexity = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    baseURL: "https://api.perplexity.ai",
  });

  const response = await perplexity.chat.completions.create({
    model: "sonar-pro",
    messages: [
      { role: "system", content: `Search for upcoming events at Second Chance Records, a vinyl record store at 5744 E Burnside St, Portland OR. Return JSON: {"events": [{"title": "...", "date": "YYYY-MM-DD", "description": "...", "time": "...", "artist_name": "...", "source_url": "..."}]}. Only confident results. Empty array if none.` },
      { role: "user", content: "Find upcoming events at Second Chance Records Portland Oregon in the next 30 days" },
    ],
    response_format: { type: "json_object" },
    search_recency_filter: "week",
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return new Response("No response from Perplexity");

  // Validate with Zod
  const parsed = eventsResponseSchema.safeParse(JSON.parse(content));
  if (!parsed.success) return new Response(`Invalid response: ${parsed.error.message}`);

  let inserted = 0;
  for (const event of parsed.data.events) {
    const existing = await db.select().from(events)
      .where(and(eq(events.title, event.title), eq(events.date, event.date)))
      .then(rows => rows[0]);

    if (!existing) {
      await db.insert(events).values({
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time || null,
        artistName: event.artist_name || null,
        sourceUrl: event.source_url || null,
        source: "auto",
        isPublished: false,
      });
      inserted++;
    }
  }

  return new Response(`Discovered ${parsed.data.events.length} events, inserted ${inserted} new`);
}

export const config: Config = { schedule: "0 8 * * *" }; // Daily at 8 AM UTC
```

```typescript
// netlify/functions/sync-instagram.mts
// NOTE: All logic inlined — Netlify Functions bundle independently from Next.js.
import type { Config } from "@netlify/functions";
import { ApifyClient } from "apify-client";
import { v2 as cloudinary } from "cloudinary";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, serial, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Inline schema (just instagram_posts table)
const instagramPosts = pgTable("instagram_posts", {
  id: serial("id").primaryKey(),
  instagramId: varchar("instagram_id", { length: 100 }).notNull().unique(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  permalink: text("permalink").notNull(),
  likesCount: integer("likes_count").default(0),
  postedAt: timestamp("posted_at").notNull(),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  isVisible: boolean("is_visible").notNull().default(true),
});

// Zod schema to validate Apify response items
const apifyPostSchema = z.object({
  shortCode: z.string(),
  displayUrl: z.string().url(),
  caption: z.string().optional().default(""),
  url: z.string().url(),
  likesCount: z.number().optional().default(0),
  timestamp: z.string(),
});

export default async function handler() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  // Scrape Instagram
  const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });
  const run = await apify.actor("apify/instagram-scraper").call({
    directUrls: ["https://www.instagram.com/second_chance_recordspdx/"],
    resultsType: "posts",
    resultsLimit: 20,
  });
  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

  let synced = 0;
  for (const rawItem of items) {
    const parsed = apifyPostSchema.safeParse(rawItem);
    if (!parsed.success) continue;
    const post = parsed.data;

    // Skip if already synced
    const existing = await db.select().from(instagramPosts)
      .where(eq(instagramPosts.instagramId, post.shortCode))
      .then(rows => rows[0]);
    if (existing) continue;

    // Download from IG CDN → upload to Cloudinary for permanent URL
    const uploaded = await cloudinary.uploader.upload(post.displayUrl, {
      public_id: `scr/instagram/${post.shortCode}`,
      overwrite: false,
      transformation: [{ width: 800, height: 800, crop: "fill", quality: "auto" }],
    });

    await db.insert(instagramPosts).values({
      instagramId: post.shortCode,
      imageUrl: uploaded.secure_url,
      caption: post.caption,
      permalink: post.url,
      likesCount: post.likesCount,
      postedAt: new Date(post.timestamp), // Parse string to Date for Postgres timestamp
    });
    synced++;
  }

  return new Response(`Fetched ${items.length} posts, synced ${synced} new`);
}

export const config: Config = { schedule: "0 9 * * *" }; // Daily at 9 AM UTC
```

### Instagram Feed Component

```typescript
// src/components/home/InstagramFeed.tsx
import { db } from "@/lib/db";
import { instagramPosts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Image from "next/image";
import ExternalLink from "@/components/ui/ExternalLink";

export default async function InstagramFeed() {
  const posts = await db.select().from(instagramPosts)
    .where(eq(instagramPosts.isVisible, true))
    .orderBy(desc(instagramPosts.postedAt))
    .limit(12);

  return (
    <section>
      <SectionHeading>Follow Us on Instagram</SectionHeading>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {posts.map(post => (
          <ExternalLink key={post.id} href={post.permalink}>
            <Image src={post.imageUrl} alt={post.caption?.slice(0, 100) || "Instagram post"}
              width={400} height={400} className="aspect-square object-cover rounded-lg" />
          </ExternalLink>
        ))}
      </div>
      <ExternalLink href="https://instagram.com/second_chance_recordspdx"
        className="text-center block mt-4">
        @second_chance_recordspdx
      </ExternalLink>
    </section>
  );
}
```

### Contact Form with Honeypot

```typescript
// src/components/contact/ContactForm.tsx
"use client";
export default function ContactForm() {
  const [loadedAt] = useState(Date.now());

  return (
    <form action={submitContact}>
      {/* Honeypot — hidden from humans, bots fill it */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      {/* Timestamp check — form must take >2s to submit */}
      <input type="hidden" name="loadedAt" value={loadedAt} />

      <Input name="name" label="Name" required />
      <Input name="email" label="Email" type="email" required />
      <Input name="subject" label="Subject" />
      <Textarea name="message" label="Message" required />
      <Button type="submit">Send Message</Button>
    </form>
  );
}

// In the server action:
// if (formData.get("website")) return; // Bot detected
// if (Date.now() - Number(formData.get("loadedAt")) < 2000) return; // Too fast
```

---

## SEO & Structured Data

Every public page gets:
- `<title>` and `<meta name="description">` via Next.js `metadata` export
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card meta tags

Root layout includes **LocalBusiness** JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "MusicStore",
  "name": "Second Chance Records",
  "address": { "@type": "PostalAddress", "streetAddress": "5744 E Burnside St, Suite 104", "addressLocality": "Portland", "addressRegion": "OR", "postalCode": "97215" },
  "telephone": "(503) 997-2729",
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Thursday","Friday","Saturday","Sunday"], "opens": "12:00", "closes": "20:00" }
  ],
  "url": "https://secondchancerecords.com",
  "sameAs": ["https://instagram.com/second_chance_recordspdx", "https://facebook.com/people/Second-Chance-Records/61577516711735/", "https://www.discogs.com/seller/SecondChance_Records/profile"]
}
```

---

## Placeholder Branding Strategy

Until Tasha provides brand assets:
- **Colors:** CSS custom properties in `globals.css` (easy to swap ~10 lines)
  - Primary: `#2D2D2D` (near-black text)
  - Accent: `#C45D3E` (warm terracotta)
  - Background: `#FAF7F2` (warm off-white)
  - Secondary: `#5B7B6A` (muted sage green)
- **Fonts:** `Inter` (body) + `Playfair Display` (headings) via `next/font/google` (self-hosted automatically)
- **Logo:** Simple SVG placeholder depicting an open cell door silhouette
- **Images:** Solid color blocks with text labels until real photos arrive

---

## Environment Variables

```bash
# .env.example
DATABASE_URL=                              # Auto-set by Netlify DB. For local: use `netlify dev`
SESSION_SECRET=                            # 32+ char random string (openssl rand -hex 32)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Perplexity Sonar Pro (event auto-discovery)
PERPLEXITY_API_KEY=

# Apify (Instagram scraper)
APIFY_API_TOKEN=

# Cloudinary (image hosting for IG posts + admin uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional
NEXT_PUBLIC_GA_ID=                         # Google Analytics measurement ID
```

---

## Tasks

### Task 1: Project Initialization
1. Run `npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint`
2. Install dependencies:
   ```
   npm install drizzle-orm @neondatabase/serverless @netlify/neon iron-session bcryptjs zod openai apify-client cloudinary
   npm install -D drizzle-kit @types/bcryptjs @netlify/plugin-nextjs
   ```
3. Initialize Netlify DB: `npx netlify db init --boilerplate=drizzle`
   - This auto-provisions Neon Postgres and sets `DATABASE_URL`
   - **IMPORTANT:** Claim the database within 7 days via Netlify dashboard or it auto-deletes
4. Create `.env.example` (committed, no secrets)
5. Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [build.environment]
     NODE_VERSION = "20"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```
6. Update `next.config.ts`:
   - Add `images.remotePatterns` for Cloudinary (`res.cloudinary.com`)
7. Update `.gitignore`: add `.env.local`
8. Create `drizzle.config.ts` (dialect: `"postgresql"`, dbCredentials: `{ url: process.env.DATABASE_URL! }` — note: no `driver` field, removed in recent Drizzle Kit versions)
9. Create `src/lib/db/index.ts` (Drizzle client)
10. Create `src/lib/db/schema.ts` (all tables)
11. Create `src/types/index.ts` (shared types)
12. Create `src/lib/validations/*.ts` (Zod schemas for all entities)

### Task 2: Database, Auth & Seed
1. Run `npx drizzle-kit push` to push schema to Neon Postgres
2. Create `scripts/seed.ts`:
   - Seed 2 admin users (Nick + Tasha) with bcrypt-hashed passwords
   - Seed all `siteSettings` keys
   - Seed `pageContent` rows for every page with real placeholder text from research doc
   - Seed sample events, featured records, reviews, partners, community resources
3. Create `src/lib/auth.ts` (iron-session config + `getSession()` for Server Components/Actions — uses `cookies()`)
4. Create `src/middleware.ts` (protect /admin/*, imports `sessionOptions` from auth.ts, calls `getIronSession(request, response, sessionOptions)` directly)
6. Create `src/lib/actions/auth.ts` (loginAction, logoutAction as Server Actions)
7. Add scripts to `package.json`: `"seed": "npx tsx scripts/seed.ts"`, `"db:push": "npx drizzle-kit push"`, `"db:studio": "npx drizzle-kit studio"`

### Task 3: Layout & Shared Components
1. Create `src/app/globals.css` — Tailwind directives + CSS custom properties for brand colors
2. Create `src/app/layout.tsx` — root layout with fonts, header, footer, JSON-LD, analytics
3. Create `src/app/not-found.tsx` — on-brand 404 page
4. Create `src/app/error.tsx` — on-brand error boundary (**must be a Client Component** — add `"use client"` at top, Next.js requirement)
5. Create `src/components/layout/Header.tsx` — sticky responsive nav with logo + links
6. Create `src/components/layout/MobileMenu.tsx` — slide-out mobile nav
7. Create `src/components/layout/Footer.tsx` — newsletter signup, contact info, socials
8. Create `src/components/layout/BackToTop.tsx` — floating button, shows after 300px scroll
9. Create shared UI components: Button, Card, Input, Textarea, ExternalLink, SectionHeading

### Task 4: Public Pages — Informational
1. **Home** (`src/app/page.tsx`):
   - Hero with tagline, logo, CTA buttons
   - Featured records section (from DB)
   - Instagram feed grid (from DB — InstagramFeed component)
   - Newsletter signup (prominent)
   - Quick links: Shop on Discogs, Events, Visit
   - Latest news preview (1-2 recent posts)
2. **About** (`src/app/about/page.tsx`):
   - Tasha's story, record restoration process, press mentions
3. **Mission & Values** (`src/app/mission/page.tsx`):
   - Mission statement, advocacy pillars, community resources list
4. **Visit / Map** (`src/app/visit/page.tsx`):
   - Address, hours, Google Maps embed, parking notes, building illustration placeholder
5. **Contact** (`src/app/contact/page.tsx`):
   - ContactForm with honeypot + timestamp bot protection
   - Subject field included
   - Stores in `contactSubmissions` table

### Task 5: Public Pages — Dynamic Content
1. **Shop** (`src/app/shop/page.tsx`) — Discogs CTAs + curated featured records
2. **Events** (`src/app/events/page.tsx`) — upcoming events, past events toggle
3. **Reviews** (`src/app/reviews/page.tsx`) — review cards with platform badges
4. **Social & Partners** (`src/app/community/page.tsx`) — social links, partners, Discogs

### Task 6: Server Actions (CRUD)
Create all action files with Zod validation + auth checks + revalidatePath:
1. `content.ts` — getPageContent, updatePageContent
2. `events.ts` — CRUD + batch reorderEvents
3. `news.ts` — CRUD
4. `records.ts` — CRUD + batch reorderRecords
5. `reviews.ts` — CRUD + batch reorderReviews
6. `partners.ts` — CRUD + batch reorderPartners
7. `resources.ts` — CRUD
8. `subscribers.ts` — getSubscribers, deleteSubscriber
9. `contact.ts` — getSubmissions, markAsRead, deleteSubmission (with honeypot check)
10. `settings.ts` — getSettings, getSettingsByGroup, updateSetting
11. `instagram.ts` — getInstagramPosts, toggleVisibility, triggerSync (calls Apify + Cloudinary pipeline inline for manual "Sync Now" button)

### Task 7: Admin Dashboard — Layout & Auth
1. `src/app/admin/login/page.tsx` — email/password form, calls loginAction
2. `src/app/admin/layout.tsx` — Server Component that checks session, renders sidebar + content
3. `src/components/admin/AdminSidebar.tsx` — nav links with active state, unread badge for contact submissions
4. `src/app/admin/page.tsx` — dashboard home with stats (subscribers, unread messages, upcoming events, draft events from auto-discovery)

### Task 8: Admin Dashboard — Content Management Components
1. `ContentEditor.tsx` — plain textarea per section, save button, calls updatePageContent
2. `SortableList.tsx` — list with up/down arrows for reordering, "Save Order" button that calls batch reorder action once
3. `ItemForm.tsx` — generic form for create/edit, accepts field definitions
4. `DataTable.tsx` — table with sortable columns, select/delete, used for subscribers + contact submissions

### Task 9: Admin Dashboard — Section Pages
Each admin page is a **Server Component** (`page.tsx`) that fetches data and passes to a **Client Component** (`*Client.tsx` in the same directory). Create both files for each section — e.g., `admin/events/page.tsx` (Server) + `admin/events/AdminEventsClient.tsx` (Client).

1. `admin/events/page.tsx` — SortableList + ItemForm. Auto-discovered drafts shown in separate "Pending Review" section with publish/dismiss buttons
2. `admin/news/page.tsx` — news list + add/edit form
3. `admin/records/page.tsx` — tabs by category (New Arrivals, Staff Picks, Local Artists) + ItemForm
4. `admin/reviews/page.tsx` — SortableList + ItemForm
5. `admin/partners/page.tsx` — SortableList + ItemForm
6. `admin/resources/page.tsx` — list + ItemForm for community resources
7. `admin/subscribers/page.tsx` — DataTable + CSV export button + total count
8. `admin/contact-submissions/page.tsx` — DataTable, expand to read, mark read, delete
9. `admin/instagram/page.tsx` — grid of synced IG posts, toggle visibility, "Sync Now" button (triggers manual scrape)
10. `admin/settings/page.tsx` — grouped key-value forms
11. `admin/pages/[slug]/page.tsx` — ContentEditor for all page content sections

### Task 10: Integration Services
1. Create `src/lib/perplexity.ts` — Sonar Pro client, discoverEvents function
2. Create `src/lib/apify.ts` — Apify client, scrapeInstagramPosts function
3. Create `src/lib/cloudinary.ts` — uploadFromUrl helper
4. Create `netlify/functions/sync-events.mts` — daily scheduled function (8 AM UTC)
5. Create `netlify/functions/sync-instagram.mts` — daily scheduled function (9 AM UTC)

### Task 11: API Routes
1. `api/newsletter/route.ts` — POST: validate email, insert subscriber (ON CONFLICT ignore)
3. `api/admin/subscribers/export/route.ts` — GET: verify session, query subscribers, return CSV

### Task 12: SEO & Production Polish
1. Add `metadata` export to every public page
2. Add `robots.ts` and `sitemap.ts` (Next.js built-in generation)
3. Add favicon and apple-touch-icon
4. Add Google Analytics via `@next/third-parties` or script tag
5. Image optimization: `next/image` everywhere with remote patterns for Cloudinary
6. Verify all external links: `target="_blank" rel="noopener noreferrer"`
7. Verify mobile responsiveness
8. Verify keyboard navigation + screen reader (semantic HTML, aria labels)
9. Add `loading.tsx` skeletons for admin pages

### Task 13: Seed Content from Research
The seed script populates with real content:

**siteSettings:** store_name, tagline, address, phone, email, hours, instagram, facebook, discogs, yelp, google_maps_embed

**pageContent:** Tasha's story, mission statement, about text, advocacy pillars — all sourced from research doc

**partners:** Portland Cherry Bombs FC

**communityResources:** OJRC, Fresh Out, NWRRC, SE Works, 211info, Oregon DOC Reentry

**reviews:** placeholder quotes (real ones TBD)

**featuredRecords:** placeholder Discogs links (real selections TBD)

---

## Deployment Checklist

### Prerequisites
- [ ] Verify Tasha has purchased secondchancerecords.com and secondchancerecordspdx.com
- [ ] Obtain API keys: Perplexity, Apify, Cloudinary (no DB keys needed — Netlify DB auto-configures)

### Setup
1. Run `npx netlify db init` to provision Netlify DB (Postgres via Neon)
2. **Claim the database** in Netlify dashboard within 7 days (or it auto-deletes)
3. Create Cloudinary account (free tier)
4. Set Netlify env vars: `SESSION_SECRET`, `PERPLEXITY_API_KEY`, `APIFY_API_TOKEN`, `CLOUDINARY_*`
   (`DATABASE_URL` is auto-set by Netlify DB)
5. Push schema: `npx drizzle-kit push`
6. Run seed: `npx tsx scripts/seed.ts` (via `netlify dev` which has `DATABASE_URL`)

### Deploy
8. Connect Netlify to GitHub repo
9. Deploy
10. Configure DNS for both domains
11. Verify SSL certificates
12. Test: admin login, content editing, newsletter signup, contact form
13. Verify scheduled functions run (check Netlify Functions logs)
14. Trigger initial Instagram sync manually

### Post-Launch
- Use `drizzle-kit generate` + `drizzle-kit migrate` for schema changes (not `push`)
- Neon dashboard available via Netlify Extensions for DB management and monitoring
- Neon free tier includes automatic point-in-time restore

---

## Deprecated Code

None — greenfield project.
