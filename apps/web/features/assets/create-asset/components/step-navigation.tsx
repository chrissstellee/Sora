"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@repo/ui/components/ui/button";

interface StepNavigationProps {
  currentStepIndex: number;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => Promise<void>;
  onSubmit: () => Promise<void>;
}

export function StepNavigation({
  currentStepIndex,
  isLastStep,
  onBack,
  onNext,
  onSubmit,
}: StepNavigationProps) {
  const [isValidating, setIsValidating] = useState(false);

  const handleNext = async () => {
    setIsValidating(true);
    try {
      await onNext();
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    setIsValidating(true);
    try {
      await onSubmit();
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {currentStepIndex > 0 && (
        <Button variant="outline" onClick={onBack} disabled={isValidating}>
          <ArrowLeft />
          Back
        </Button>
      )}

      {isLastStep ? (
        <Button variant="gradient" onClick={handleSubmit} disabled={isValidating}>
          {isValidating ? "Submitting..." : "Submit"}
        </Button>
      ) : (
        <Button variant="gradient" onClick={handleNext} disabled={isValidating}>
          {isValidating ? "Validating..." : "Next Step"}
          <ArrowRight />
        </Button>
      )}
    </div>
  );
}
