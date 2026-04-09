import { z } from "zod";

export const recordSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  category: z.enum(["new_arrivals", "staff_picks", "local_artists"]),
  discogsUrl: z.string().url("Must be a valid URL"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});
