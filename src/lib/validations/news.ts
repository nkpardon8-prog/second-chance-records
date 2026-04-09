import { z } from "zod";

export const newsSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});
