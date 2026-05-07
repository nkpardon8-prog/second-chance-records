import { z } from "zod";

export const pillarSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  linkUrl: z.string().url().optional().or(z.literal("")),
  linkLabel: z.string().max(200).optional(),
});
