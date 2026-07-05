"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";

import Aurora from "./shared/aurora";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
      <div className="absolute inset-0 -z-10">
        <Aurora
          colorStops={["#380f80", "#7c3aed", "#a16682"]}
          blend={0.45}
          amplitude={1.2}
          speed={0.6}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/30 px-4 py-1.5 font-mono text-xs tracking-wide text-foreground"
        >
          Now Live: Enterprise Workflow Updates
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          Enterprise Infrastructure for
          <br />
          <span className="bg-linear-to-r from-soft-primary via-soft-destructive to-soft-secondary bg-clip-text text-transparent">
            Real-World Asset Tokenization.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-balance text-muted-foreground sm:text-lg"
        >
          Create, issue, and manage tokenized real-world assets on Stellar through a unified
          enterprise dashboard and developer APIs. Sora abstracts blockchain complexity so
          organizations can focus on building financial products&mdash;not blockchain
          infrastructure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button variant="gradient" size="lg" className="w-full sm:w-auto">
            Launch Platform
            <ArrowRight />
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <BookOpen />
            View Documentation
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
