"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

import { CREATE_ASSET_STEPS } from "../constants/steps-config";
import { createAssetFormSchema } from "../lib/schema";

import type { CreateAssetFormValues } from "../lib/schema";
import type {
  IBasicInformation,
  ICreateAssetFormState,
  IOwnershipDetails,
  IUploadedDocument,
} from "../lib/types";
import type { UseFormReturn } from "react-hook-form";

const EMPTY_BASIC_INFORMATION: IBasicInformation = {
  assetName: "",
  assetCategory: "",
  assetDescription: "",
  estimatedValue: "",
  currency: "",
  country: "",
  physicalAddress: "",
};

const EMPTY_OWNERSHIP_DETAILS: IOwnershipDetails = {
  legalOwner: "",
  organizationName: "",
  ownershipType: "",
  registrationNumber: "",
  contactEmail: "",
  contactPhone: "",
  internalOwnershipNotes: "",
};

export interface UseCreateAssetFormResult {
  form: ICreateAssetFormState;
  currentStepIndex: number;
  completionPercent: number;
  formMethods: UseFormReturn<CreateAssetFormValues>;
  goNext: () => Promise<void>;
  goBack: () => void;
  goToStep: (index: number) => void;
  updateBasicInformation: (patch: Partial<IBasicInformation>) => void;
  updateOwnershipDetails: (patch: Partial<IOwnershipDetails>) => void;
  addDocuments: (files: File[]) => void;
  removeDocument: (id: string) => void;
}

function labelForBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function useCreateAssetForm(): UseCreateAssetFormResult {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [basicInformation, setBasicInformation] = React.useState(EMPTY_BASIC_INFORMATION);
  const [ownershipDetails, setOwnershipDetails] = React.useState(EMPTY_OWNERSHIP_DETAILS);
  const [documents, setDocuments] = React.useState<IUploadedDocument[]>([
    {
      id: "seed-1",
      name: "Property_Title.pdf",
      sizeLabel: "2.4 MB",
      tag: "LEGAL TITLE",
      uploadedAt: "Oct 24, 2023",
    },
    {
      id: "seed-2",
      name: "Appraisal_Report.docx",
      sizeLabel: "1.1 MB",
      tag: "VALUATION",
      uploadedAt: "Oct 24, 2023",
    },
  ]);

  const formMethods = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetFormSchema),
    mode: "onChange",
    defaultValues: {
      basicInformation: EMPTY_BASIC_INFORMATION,
      ownershipDetails: EMPTY_OWNERSHIP_DETAILS,
    },
  });

  const lastStepIndex = CREATE_ASSET_STEPS.length - 1;

  const goNext = async () => {
    const activeStep = CREATE_ASSET_STEPS[currentStepIndex];
    if (!activeStep) return;

    // Validate current step
    if (activeStep.key === "basic-information") {
      const isValid = await formMethods.trigger("basicInformation");
      if (isValid) {
        setCurrentStepIndex((i) => Math.min(lastStepIndex, i + 1));
      }
    } else if (activeStep.key === "ownership-details") {
      const isValid = await formMethods.trigger("ownershipDetails");
      if (isValid) {
        setCurrentStepIndex((i) => Math.min(lastStepIndex, i + 1));
      }
    } else {
      // supporting-documents and review-submit don't need validation
      setCurrentStepIndex((i) => Math.min(lastStepIndex, i + 1));
    }
  };

  const goBack = () => setCurrentStepIndex((i) => Math.max(0, i - 1));
  const goToStep = (index: number) =>
    setCurrentStepIndex(Math.max(0, Math.min(lastStepIndex, index)));

  const updateBasicInformation = (patch: Partial<IBasicInformation>) => {
    setBasicInformation((prev) => ({ ...prev, ...patch }));
    formMethods.setValue("basicInformation", { ...basicInformation, ...patch });
  };

  const updateOwnershipDetails = (patch: Partial<IOwnershipDetails>) => {
    setOwnershipDetails((prev) => ({ ...prev, ...patch }));
    formMethods.setValue("ownershipDetails", { ...ownershipDetails, ...patch });
  };

  const addDocuments = (files: File[]) => {
    const newDocs: IUploadedDocument[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      sizeLabel: labelForBytes(file.size),
      tag: "SUPPORTING DOC",
      uploadedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const removeDocument = (id: string) =>
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));

  const completionPercent = Math.round(((currentStepIndex + 1) / CREATE_ASSET_STEPS.length) * 100);

  return {
    form: { basicInformation, ownershipDetails, documents },
    currentStepIndex,
    completionPercent,
    formMethods,
    goNext,
    goBack,
    goToStep,
    updateBasicInformation,
    updateOwnershipDetails,
    addDocuments,
    removeDocument,
  };
}
