import OpenAI from "openai";
import { z } from "zod";

const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY!,
  baseURL: "https://api.perplexity.ai",
});

const discoveredEventSchema = z.object({
  title: z.string(),
  date: z.string(),
  time: z.string().optional(),
  description: z.string(),
  artist_name: z.string().optional(),
  source_url: z.string().optional(),
});

const eventsResponseSchema = z.object({
  events: z.array(discoveredEventSchema),
});

export type DiscoveredEvent = z.infer<typeof discoveredEventSchema>;

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
        content:
          "Find upcoming events at Second Chance Records Portland Oregon in the next 30 days",
      },
    ],
    response_format: {
      type: "json_schema" as const,
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
  } as OpenAI.ChatCompletionCreateParamsNonStreaming & { search_recency_filter: string });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = eventsResponseSchema.safeParse(JSON.parse(content));
  if (!parsed.success) return [];

  return parsed.data.events;
}
