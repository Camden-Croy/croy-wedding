"use client";

import { createAuthClient } from "better-auth/react";

/** Client-side Better Auth helpers for the admin sign-in / sign-out UI. */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
