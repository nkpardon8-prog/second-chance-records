import * as schema from "@/lib/db/schema";

export type User = typeof schema.users.$inferSelect;
export type SiteSetting = typeof schema.siteSettings.$inferSelect;
export type PageContent = typeof schema.pageContent.$inferSelect;
export type Event = typeof schema.events.$inferSelect;
export type News = typeof schema.news.$inferSelect;
export type FeaturedRecord = typeof schema.featuredRecords.$inferSelect;
export type Review = typeof schema.reviews.$inferSelect;
export type Partner = typeof schema.partners.$inferSelect;
export type CommunityResource = typeof schema.communityResources.$inferSelect;
export type Subscriber = typeof schema.subscribers.$inferSelect;
export type ContactSubmission = typeof schema.contactSubmissions.$inferSelect;
export type InstagramPost = typeof schema.instagramPosts.$inferSelect;
