import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: number;
  email: string;
  name: string;
  isLoggedIn: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "scr-admin-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
