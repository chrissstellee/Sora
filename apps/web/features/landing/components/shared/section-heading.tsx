import { cn } from "@repo/ui/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  eyebrowClassName?: string;
  className?: string;
}

/** Consistent eyebrow / title / description block used to open a section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  eyebrowClassName,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 font-mono text-xs font-medium tracking-[0.2em] text-soft-primary uppercase",
            eyebrowClassName,
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-2xl text-base text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
