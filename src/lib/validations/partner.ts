import { z } from "zod";

export const partnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});
