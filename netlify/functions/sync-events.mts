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
      {
        role: "system",
        content: `Search for upcoming events at Second Chance Records, a vinyl record store at 5744 E Burnside St, Portland OR. Return JSON: {"events": [{"title": "...", "date": "YYYY-MM-DD", "description": "...", "time": "...", "artist_name": "...", "source_url": "..."}]}. Only confident results. Empty array if none.`,
      },
      {
        role: "user",
        content: "Find upcoming events at Second Chance Records Portland Oregon in the next 30 days",
      },
    ],
    response_format: { type: "json_object" },
    search_recency_filter: "week",
  } as any);

  const content = response.choices[0]?.message?.content;
  if (!content) return new Response("No response from Perplexity");

  // Validate with Zod
  const parsed = eventsResponseSchema.safeParse(JSON.parse(content));
  if (!parsed.success) return new Response(`Invalid response: ${parsed.error.message}`);

  let inserted = 0;
  for (const event of parsed.data.events) {
    const existing = await db
      .select()
      .from(events)
      .where(and(eq(events.title, event.title), eq(events.date, event.date)))
      .then((rows) => rows[0]);

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

export const config: Config = { schedule: "0 8 * * *" };
