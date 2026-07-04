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
}

/**
 * Fades and lifts its children into place once they scroll into view.
 * Animation runs once per mount — re-scrolling past it won't replay it.
 */
export function Reveal({ children, delay = 0, className, y = 20 }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
