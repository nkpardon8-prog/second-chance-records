import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  time: z.string().max(20).optional(),
  artistName: z.string().max(200).optional(),
  artistUrl: z.string().url().optional().or(z.literal("")),
});
