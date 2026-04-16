import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Prefer NETLIFY_DATABASE_URL (Netlify-provisioned, correct for production).
// Fall back to DATABASE_URL for local dev.
const dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL!;
const sql = neon(dbUrl);
export const db = drizzle(sql, { schema });
