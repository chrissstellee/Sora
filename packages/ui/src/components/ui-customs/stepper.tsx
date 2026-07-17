"use client";

import { Check } from "lucide-react";

import { cn } from "../../lib/utils";

export type TStepStatus = "complete" | "current" | "upcoming";

export interface IStepperStep {
  key: string;
  label: string;
}

export interface StepperProps {
  steps: IStepperStep[];
  /** 0-indexed position of the current step */
  currentIndex: number;
  /**
   * Called when a step is clicked. Omit to render a non-interactive tracker.
   * Callers typically only allow navigating to already-completed steps.
   */
  onStepClick?: (index: number) => void;
  className?: string;
}

function statusFor(index: number, currentIndex: number): TStepStatus {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function Stepper({ steps, currentIndex, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn("flex w-full items-start", className)}>
      {steps.map((step, index) => {
        const status = statusFor(index, currentIndex);
        const isLast = index === steps.length - 1;
        const clickable = Boolean(onStepClick) && status !== "upcoming";

        return (
          <li key={step.key} className={cn("flex flex-col gap-2", isLast ? "flex-none" : "flex-1")}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(index)}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  status === "complete" && "border-secondary bg-secondary text-background",
                  status === "current" && "border-secondary bg-secondary text-background",
                  status === "upcoming" && "border-border bg-transparent text-muted-foreground",
                  clickable && "cursor-pointer",
                  !clickable && "cursor-default",
                )}
                aria-current={status === "current" ? "step" : undefined}
              >
                {status === "complete" ? <Check className="size-3.5" /> : index + 1}
              </button>

              <span
                className={cn(
                  "text-xs font-semibold tracking-wider whitespace-nowrap uppercase",
                  status === "upcoming" ? "text-muted-foreground" : "text-secondary",
                )}
              >
                {step.label}
              </span>

              {!isLast && <div className="mx-2 h-px flex-1 border-t border-dashed border-border" />}
            </div>

            <div
              className={cn(
                "h-0.5 w-full rounded-full",
                status === "upcoming" ? "bg-border" : "bg-secondary",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}
