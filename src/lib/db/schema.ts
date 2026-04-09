import { pgTable, serial, text, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  group: varchar("group", { length: 50 }).notNull(),
});

export const pageContent = pgTable("page_content", {
  id: serial("id").primaryKey(),
  pageSlug: varchar("page_slug", { length: 100 }).notNull(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  contentType: varchar("content_type", { length: 20 }).notNull().default("text"),
  content: text("content").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 20 }),
  artistName: varchar("artist_name", { length: 300 }),
  artistUrl: text("artist_url"),
  imageUrl: text("image_url"),
  sourceUrl: text("source_url"),
  source: varchar("source", { length: 20 }).notNull().default("manual"),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  author: varchar("author", { length: 200 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  rating: integer("rating"),
  quote: text("quote").notNull(),
  isFeatured: boolean("is_featured").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: text("url").notNull(),
  logoUrl: text("logo_url"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const communityResources = pgTable("community_resources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 300 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const instagramPosts = pgTable("instagram_posts", {
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
