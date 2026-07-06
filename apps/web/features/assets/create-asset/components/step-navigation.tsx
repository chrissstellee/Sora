import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";

interface StepNavigationProps {
  currentStepIndex: number;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function StepNavigation({
  currentStepIndex,
  isLastStep,
  onBack,
  onNext,
  onSubmit,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {currentStepIndex > 0 && (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
      )}

      {isLastStep ? (
        <Button variant="gradient" onClick={onSubmit}>
          Submit
        </Button>
      ) : (
        <Button variant="gradient" onClick={onNext}>
          Next Step
          <ArrowRight />
        </Button>
      )}
    </div>
  );
}
