"use client";

import { Stepper } from "@repo/ui/components/ui-customs/stepper";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { CreateAssetHeader } from "./components/create-asset-header";
import { CreateAssetSummarySidebar } from "./components/create-asset-summary-sidebar";
import { StepNavigation } from "./components/step-navigation";
import { BasicInformationStep } from "./components/steps/basic-information-step";
import { OwnershipDetailsStep } from "./components/steps/ownership-details-step";
import { ReviewSubmitStep } from "./components/steps/review-submit-step";
import { SupportingDocumentsStep } from "./components/steps/supporting-documents-step";
import { CREATE_ASSET_STEPS } from "./constants/steps-config";
import { useCreateAssetForm } from "./hooks/use-create-asset-form";

export function CreateAssetPage() {
  const {
    form,
    currentStepIndex,
    completionPercent,
    goNext,
    goBack,
    goToStep,
    updateBasicInformation,
    updateOwnershipDetails,
    addDocuments,
    removeDocument,
  } = useCreateAssetForm();

  const isLastStep = currentStepIndex === CREATE_ASSET_STEPS.length - 1;
  const activeStep = CREATE_ASSET_STEPS[currentStepIndex]!;

  const handleSubmit = () => {
    // Wire this up to the real create-asset mutation when the API is ready.
    console.log("Submitting asset", form);
  };

  return (
    <div className="flex flex-col gap-6">
      <CreateAssetHeader />

      <Stepper
        steps={CREATE_ASSET_STEPS.map((step) => ({ key: step.key, label: step.label }))}
        currentIndex={currentStepIndex}
        onStepClick={goToStep}
      />

      <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-secondary">
                Step {currentStepIndex + 1}:{" "}
                <span className="text-foreground">{activeStep.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeStep.key === "basic-information" && (
                <BasicInformationStep
                  value={form.basicInformation}
                  onChange={updateBasicInformation}
                />
              )}
              {activeStep.key === "ownership-details" && (
                <OwnershipDetailsStep
                  value={form.ownershipDetails}
                  onChange={updateOwnershipDetails}
                />
              )}
              {activeStep.key === "supporting-documents" && (
                <SupportingDocumentsStep
                  documents={form.documents}
                  onFilesSelected={addDocuments}
                  onRemoveDocument={removeDocument}
                />
              )}
              {activeStep.key === "review-submit" && (
                <ReviewSubmitStep form={form} onEditStep={goToStep} />
              )}
            </CardContent>
          </Card>

          <StepNavigation
            currentStepIndex={currentStepIndex}
            isLastStep={isLastStep}
            onBack={goBack}
            onNext={goNext}
            onSubmit={handleSubmit}
          />
        </div>

        <CreateAssetSummarySidebar
          form={form}
          completionPercent={completionPercent}
          isLastStep={isLastStep}
        />
      </div>
    </div>
  );
}
