"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { InputGroup, InputGroupInput } from "@repo/ui/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";

import { OWNERSHIP_TYPE_OPTIONS } from "../../constants/ownership-type-options";

import type { CreateAssetFormValues } from "../../lib/schema";
import type { IOwnershipDetails } from "../../lib/types";

const labelClass = "text-xs font-medium tracking-widest text-muted-foreground uppercase";

interface OwnershipDetailsStepProps {
  value: IOwnershipDetails;
  onChange: (patch: Partial<IOwnershipDetails>) => void;
}

export function OwnershipDetailsStep({ onChange }: OwnershipDetailsStepProps) {
  const { control } = useFormContext<CreateAssetFormValues>();

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={control}
        name="ownershipDetails.legalOwner"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>Legal Owner</FormLabel>
            <FormControl>
              <InputGroup>
                <InputGroupInput
                  placeholder="Juan Dela Cruz"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange({ legalOwner: e.target.value });
                  }}
                />
              </InputGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="ownershipDetails.organizationName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>Organization Name</FormLabel>
            <FormControl>
              <InputGroup>
                <InputGroupInput
                  placeholder="Acme Real Estate Holdings"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange({ organizationName: e.target.value });
                  }}
                />
              </InputGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={control}
          name="ownershipDetails.ownershipType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className={labelClass}>Ownership Type</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    onChange({ ownershipType: v });
                  }}
                >
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select ownership type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERSHIP_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="ownershipDetails.registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Registration Number</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput
                    placeholder="Tax ID / Company Reg No"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange({ registrationNumber: e.target.value });
                    }}
                  />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={control}
          name="ownershipDetails.contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Contact Email</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput
                    type="email"
                    placeholder="name@org.com"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange({ contactEmail: e.target.value });
                    }}
                  />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="ownershipDetails.contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Contact Phone</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange({ contactPhone: e.target.value });
                    }}
                  />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="ownershipDetails.internalOwnershipNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>Internal Ownership Notes (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe complex ownership structures, beneficiary details, or internal references..."
                rows={4}
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  onChange({ internalOwnershipNotes: e.target.value });
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
