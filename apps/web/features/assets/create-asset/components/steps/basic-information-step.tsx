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

import { ASSET_CATEGORY_OPTIONS } from "../../../constants/assets";
import { CURRENCY_OPTIONS } from "../../constants/create-asset";

import type { CreateAssetFormValues } from "../../lib/schema";
import type { IBasicInformation } from "../../lib/types";

const labelClass = "text-xs font-medium tracking-widest text-muted-foreground uppercase";

interface BasicInformationStepProps {
  value: IBasicInformation;
  onChange: (patch: Partial<IBasicInformation>) => void;
}

export function BasicInformationStep({ onChange }: BasicInformationStepProps) {
  const { control } = useFormContext<CreateAssetFormValues>();

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={control}
        name="basicInformation.assetName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>Asset Name</FormLabel>
            <FormControl>
              <InputGroup>
                <InputGroupInput
                  placeholder="Downtown Office Tower"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange({ assetName: e.target.value });
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
        name="basicInformation.assetCategory"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className={labelClass}>Asset Category</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  onChange({ assetCategory: v as IBasicInformation["assetCategory"] });
                }}
              >
                <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORY_OPTIONS.map((option) => (
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
        name="basicInformation.assetDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>Asset Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Provide a detailed overview of the asset's history and condition..."
                rows={4}
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  onChange({ assetDescription: e.target.value });
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={control}
          name="basicInformation.estimatedValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Estimated Value</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    placeholder="$ 0.00"
                    inputMode="decimal"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange({ estimatedValue: e.target.value });
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
          name="basicInformation.currency"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className={labelClass}>Currency</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    onChange({ currency: v });
                  }}
                >
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
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
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={control}
          name="basicInformation.country"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Country</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput
                    placeholder="e.g. United States"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange({ country: e.target.value });
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
          name="basicInformation.physicalAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Physical Address</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput
                    placeholder="Street address, City, State"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange({ physicalAddress: e.target.value });
                    }}
                  />
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
