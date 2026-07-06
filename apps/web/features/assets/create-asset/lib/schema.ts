import { z } from "zod";

export const basicInformationSchema = z.object({
  assetName: z
    .string()
    .min(1, "Asset name is required")
    .min(3, "Asset name must be at least 3 characters"),
  assetCategory: z.string().min(1, "Asset category is required"),
  assetDescription: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length >= 20,
      "Notes must be at least 20 characters if provided",
    ),
  estimatedValue: z
    .string()
    .min(1, "Estimated value is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  currency: z.string().min(1, "Currency is required"),
  country: z.string().min(1, "Country is required").min(2, "Enter a valid country"),
  physicalAddress: z
    .string()
    .min(1, "Physical address is required")
    .min(5, "Physical address must be at least 5 characters"),
});

export type BasicInformationValues = z.infer<typeof basicInformationSchema>;

export const ownershipDetailsSchema = z.object({
  legalOwner: z.string().min(1, "Legal owner is required").min(2, "Enter a valid name"),
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .min(2, "Enter a valid organization name"),
  ownershipType: z.string().min(1, "Ownership type is required"),
  registrationNumber: z
    .string()
    .min(1, "Registration number is required")
    .min(3, "Registration number must be at least 3 characters"),
  contactEmail: z.string().min(1, "Contact email is required").email("Enter a valid email address"),
  contactPhone: z
    .string()
    .min(1, "Contact phone is required")
    .regex(/^[+]?[\d\s\-()]+$/, "Enter a valid phone number"),
  internalOwnershipNotes: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length >= 10,
      "Notes must be at least 10 characters if provided",
    ),
});

export type OwnershipDetailsValues = z.infer<typeof ownershipDetailsSchema>;

export const createAssetFormSchema = z.object({
  basicInformation: basicInformationSchema,
  ownershipDetails: ownershipDetailsSchema,
});

export type CreateAssetFormValues = z.infer<typeof createAssetFormSchema>;
