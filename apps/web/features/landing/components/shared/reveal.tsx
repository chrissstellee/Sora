"use client";

import { motion } from "framer-motion";

import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before the animation starts. Use to stagger sibling reveals. */
  delay?: number;
  className?: string;
  /** Vertical offset (px) the element travels while fading in. */
  y?: number;
  /** Horizontal offset (px) the element travels while fading in. */
  x?: number;
  /** Starting scale of the element. 1 = no scale effect. */
  scale?: number;
  /** Whether the animation should only play the first time it enters view. */
  once?: boolean;
  /** Duration of the animation in seconds. */
  duration?: number;
}

/**
 * Fades, lifts, and softly scales its children into place as they scroll into view.
 * By default replays every time the element re-enters the viewport; pass `once`
 * to play it only on first mount.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
  x = 0,
  scale = 0.96,
  once = false,
  duration = 1,
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, x, scale, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
