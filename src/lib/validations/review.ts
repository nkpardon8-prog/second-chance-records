import { z } from "zod";

export const reviewSchema = z.object({
  author: z.string().min(1, "Author is required"),
  platform: z.enum(["google", "yelp"]),
  rating: z.number().int().min(1).max(5).optional(),
  quote: z.string().min(1, "Quote is required"),
});
