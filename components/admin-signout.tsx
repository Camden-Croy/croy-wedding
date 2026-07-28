"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function AdminSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut();
    router.push("/admin/sign-in");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-70"
    >
      <LogOut className="size-4" aria-hidden />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
