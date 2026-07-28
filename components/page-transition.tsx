"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated view container (Req 7.3). Framer Motion's `useReducedMotion`
 * disables movement when the OS requests reduced motion (Req 7.4).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.main
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
      className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:py-16"
    >
      {children}
    </motion.main>
  );
}
