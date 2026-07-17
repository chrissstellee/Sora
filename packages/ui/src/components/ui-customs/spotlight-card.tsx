"use client";

import React, { useRef, useState } from "react";

import { cn } from "@repo/ui/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly spotlightColor?: string;
  readonly spotlightRadius?: number;
  readonly interactive?: boolean;
}

/**
 * A card component that projects a radial gradient overlay tracking the user's cursor.
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(124, 58, 237, 0.16)",
  spotlightRadius = 260,
  interactive = true,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();

    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300",
        interactive &&
          "hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.15),0_20px_60px_rgba(7,7,10,0.35)]",
        className,
      )}
      {...props}
    >
      {/* Cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(${spotlightRadius}px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 78%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
