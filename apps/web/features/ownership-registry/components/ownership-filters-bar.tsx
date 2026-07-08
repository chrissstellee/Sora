"use client";

import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";

import { ASSET_FILTER_OPTIONS } from "../constants/ownership";

import type { HolderFiltersState } from "../hooks/use-holder-filters";
import type { THolderType } from "../lib/types";

const HOLDER_TYPES: THolderType[] = ["Institutional", "Retail"];

interface OwnershipFiltersBarProps {
  filters: HolderFiltersState;
  onAssetChange: (value: string) => void;
  onHolderTypeChange: (value: THolderType) => void;
  onShowConcentratedOnlyChange: (value: boolean) => void;
}

export function OwnershipFiltersBar({
  filters,
  onAssetChange,
  onHolderTypeChange,
  onShowConcentratedOnlyChange,
}: OwnershipFiltersBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Viewing Asset
        </span>
        <Select value={filters.assetCode} onValueChange={onAssetChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Holder Type
        </span>
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted p-0.5">
          {HOLDER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onHolderTypeChange(type)}
              className={cn(
                "rounded-sm px-3 py-1 text-xs font-medium tracking-wide uppercase transition-colors",
                filters.holderType === type
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="show-concentrated-only"
          checked={filters.showConcentratedOnly}
          onCheckedChange={(checked) => onShowConcentratedOnlyChange(checked === true)}
        />
        <label htmlFor="show-concentrated-only" className="text-sm text-muted-foreground">
          Show Holders &gt; 5% Supply
        </label>
      </div>
    </div>
  );
}
