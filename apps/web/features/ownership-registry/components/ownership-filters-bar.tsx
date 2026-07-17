"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";

import type { OwnershipAssetOption } from "../lib/types";

interface OwnershipFiltersBarProps {
  assets: OwnershipAssetOption[];
  selectedAssetId?: string;
  query: string;
  onAssetChange: (assetId: string) => void;
  onSearch: (query: string) => void;
}

export function OwnershipFiltersBar({
  assets,
  selectedAssetId,
  query,
  onAssetChange,
  onSearch,
}: OwnershipFiltersBarProps) {
  const [value, setValue] = React.useState(query);
  React.useEffect(() => setValue(query), [query]);

  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card px-5 py-4 md:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Confirmed asset
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={selectedAssetId ?? ""}
          onChange={(event) => onAssetChange(event.target.value)}
          disabled={assets.length === 0}
        >
          {assets.length === 0 && <option value="">No confirmed assets available</option>}
          {assets.map((asset) => (
            <option key={asset.assetId} value={asset.assetId}>
              {asset.label}
            </option>
          ))}
        </select>
      </label>
      <form
        className="flex items-end gap-2"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(value);
        }}
      >
        <label
          htmlFor="ownership-account-search"
          className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium"
        >
          Account search
          <Input
            id="ownership-account-search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="G… public account or prefix"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <Button type="submit" variant="outline">
          <Search aria-hidden="true" /> Search
        </Button>
      </form>
    </div>
  );
}
