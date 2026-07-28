import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Catch-all handler for Better Auth endpoints (/api/auth/*), including the
// Google OAuth callback at /api/auth/callback/google.
export const { GET, POST } = toNextJsHandler(auth);
