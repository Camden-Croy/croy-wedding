"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Route-level error boundary (Req 6.4). The surrounding layout — including the
 * navigation — stays mounted, so the current view is retained while this
 * message explains that the requested view is unavailable.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-24 text-center">
      <AlertTriangle className="size-10 text-accent" aria-hidden />
      <h1 className="mt-6 font-serif text-3xl text-foreground">
        This view is unavailable
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Something went wrong while loading this page. You can try again or use the
        navigation above to continue exploring.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 font-medium text-background transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      >
        Try again
      </button>
    </main>
  );
}
