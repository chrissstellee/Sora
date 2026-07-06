import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";

import { ASSET_CATEGORY_OPTIONS } from "../../../constants/asset-category-options";
import { CURRENCY_OPTIONS } from "../../constants/currency-options";

import type { IBasicInformation } from "../../lib/types";

interface BasicInformationStepProps {
  value: IBasicInformation;
  onChange: (patch: Partial<IBasicInformation>) => void;
}

export function BasicInformationStep({ value, onChange }: BasicInformationStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assetName">Asset Name</Label>
        <Input
          id="assetName"
          value={value.assetName}
          onChange={(e) => onChange({ assetName: e.target.value })}
          placeholder="Downtown Office Tower"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assetCategory">Asset Category</Label>
        <Select
          value={value.assetCategory}
          onValueChange={(v) =>
            onChange({ assetCategory: v as IBasicInformation["assetCategory"] })
          }
        >
          <SelectTrigger id="assetCategory" className="w-full">
            <SelectValue placeholder="Real Estate" />
          </SelectTrigger>
          <SelectContent>
            {ASSET_CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assetDescription">Asset Description</Label>
        <Textarea
          id="assetDescription"
          value={value.assetDescription}
          onChange={(e) => onChange({ assetDescription: e.target.value })}
          placeholder="Provide a detailed overview of the asset's history and condition..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimatedValue">Estimated Value</Label>
          <Input
            id="estimatedValue"
            value={value.estimatedValue}
            onChange={(e) => onChange({ estimatedValue: e.target.value })}
            placeholder="$ 0.00"
            inputMode="decimal"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Select value={value.currency} onValueChange={(v) => onChange({ currency: v })}>
            <SelectTrigger id="currency" className="w-full">
              <SelectValue placeholder="USD" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={value.country}
            onChange={(e) => onChange({ country: e.target.value })}
            placeholder="e.g. United States"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="physicalAddress">Physical Address</Label>
          <Input
            id="physicalAddress"
            value={value.physicalAddress}
            onChange={(e) => onChange({ physicalAddress: e.target.value })}
            placeholder="Street address, City, State"
          />
        </div>
      </div>
    </div>
  );
}
