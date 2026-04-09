"use server";

import OpenAI from "openai";
import { z } from "zod";
import { getSession } from "@/lib/auth";

const discoveredEventSchema = z.object({
  title: z.string(),
  date: z.string(),
  description: z.string(),
  time: z.string().optional(),
  artist_name: z.string().optional(),
  source_url: z.string().optional(),
});

const eventsResponseSchema = z.object({
  events: z.array(discoveredEventSchema),
});

const discoveredResourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  description: z.string(),
});

const resourcesResponseSchema = z.object({
  resources: z.array(discoveredResourceSchema),
});

export type DiscoveredEvent = z.infer<typeof discoveredEventSchema>;
export type DiscoveredResource = z.infer<typeof discoveredResourceSchema>;

function getPerplexityClient() {
  return new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    baseURL: "https://api.perplexity.ai",
  });
}

export async function searchEvents(
  query?: string
): Promise<{ events: DiscoveredEvent[]; error?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { events: [], error: "Unauthorized" };

  const perplexity = getPerplexityClient();
  const userQuery =
    query?.trim() ||
    "Find upcoming events at Second Chance Records Portland Oregon in the next 30 days";

  try {
    const response = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: `Search for upcoming music and vinyl events. Return a JSON object with an "events" array. Each event should have: title (string), date (YYYY-MM-DD), description (string), time (string, optional), artist_name (string, optional), source_url (string, optional). Only include events you are confident about. If no events found, return {"events": []}.`,
        },
        { role: "user", content: userQuery },
      ],
      response_format: { type: "json_object" },
      search_recency_filter: "week",
    } as any);

    const content = response.choices[0]?.message?.content;
    if (!content) return { events: [] };

    const parsed = eventsResponseSchema.safeParse(JSON.parse(content));
    if (!parsed.success) return { events: [], error: "Failed to parse results" };

    return { events: parsed.data.events };
  } catch (e: any) {
    return { events: [], error: e.message ?? "Search failed" };
  }
}

export async function searchResources(
  query?: string
): Promise<{ resources: DiscoveredResource[]; error?: string }> {
  const session = await getSession();
  if (!session.isLoggedIn) return { resources: [], error: "Unauthorized" };

  const perplexity = getPerplexityClient();
  const userQuery =
    query?.trim() ||
    "Find community resources for vinyl record collectors and music lovers in Portland Oregon — record stores, music venues, community organizations, local music publications, and related resources";

  try {
    const response = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: `Search for community resources related to vinyl records, music, and local culture in the Portland, Oregon area. Return a JSON object with a "resources" array. Each resource should have: name (string), url (string — must be a real URL), description (string). Only include resources you are confident about. If none found, return {"resources": []}.`,
        },
        { role: "user", content: userQuery },
      ],
      response_format: { type: "json_object" },
      search_recency_filter: "month",
    } as any);

    const content = response.choices[0]?.message?.content;
    if (!content) return { resources: [] };

    const parsed = resourcesResponseSchema.safeParse(JSON.parse(content));
    if (!parsed.success)
      return { resources: [], error: "Failed to parse results" };

    return { resources: parsed.data.resources };
  } catch (e: any) {
    return { resources: [], error: e.message ?? "Search failed" };
  }
}
