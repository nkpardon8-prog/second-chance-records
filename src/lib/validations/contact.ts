import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Must be a valid email"),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required").max(5000),
});
