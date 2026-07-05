"use client";

import { cn } from "@repo/ui/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

type Strength = 0 | 1 | 2 | 3 | 4;

const LABELS: Record<Strength, string> = {
  0: "Too weak",
  1: "Weak",
  2: "Medium",
  3: "Strong",
  4: "Very strong",
};

function getStrength(password: string): Strength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4) as Strength;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = getStrength(password);

  return (
    <div className="mt-1 flex flex-col gap-2.5">
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full bg-muted transition-colors",
              i < strength && strength <= 1 && "bg-destructive",
              i < strength && strength === 2 && "bg-primary",
              i < strength && strength >= 3 && "bg-success",
            )}
          />
        ))}
      </div>
      {password && (
        <span className="font-mono text-xs text-muted-foreground uppercase">
          Strength: {LABELS[strength]}
        </span>
      )}
    </div>
  );
}
