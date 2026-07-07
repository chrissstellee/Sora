"use client";

import { Download, ListFilter, Search } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import {
  COUNTRY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "../constants/tokenization";

import type { TokenizationFiltersState } from "../hooks/use-tokenization-filters";

interface TokenizationToolbarProps {
  filters: TokenizationFiltersState;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onExport?: () => void;
}

export function TokenizationToolbar({
  filters,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onCountryChange,
  onExport,
}: TokenizationToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by asset name, ID, or owner..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.type} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.country} onValueChange={onCountryChange}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" aria-label="More filters">
          <ListFilter />
        </Button>

        <Button variant="outline" onClick={onExport}>
          <Download />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
