"use client";

import * as React from "react";

import type { IIssuanceQueueEntry } from "../lib/types";

export interface TokenizationFiltersState {
  search: string;
  type: string;
  status: string;
  country: string;
}

const DEFAULT_FILTERS: TokenizationFiltersState = {
  search: "",
  type: "all",
  status: "all",
  country: "all",
};

interface IUseTokenizationFiltersResult {
  filters: TokenizationFiltersState;
  setSearch: (value: string) => void;
  setType: (value: string) => void;
  setStatus: (value: string) => void;
  setCountry: (value: string) => void;
  filteredEntries: IIssuanceQueueEntry[];
}

export function useTokenizationFilters(
  entries: IIssuanceQueueEntry[],
): IUseTokenizationFiltersResult {
  const [filters, setFilters] = React.useState<TokenizationFiltersState>(DEFAULT_FILTERS);

  const setSearch = (value: string) => setFilters((prev) => ({ ...prev, search: value }));
  const setType = (value: string) => setFilters((prev) => ({ ...prev, type: value }));
  const setStatus = (value: string) => setFilters((prev) => ({ ...prev, status: value }));
  const setCountry = (value: string) => setFilters((prev) => ({ ...prev, country: value }));

  const filteredEntries = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesSearch =
        !search ||
        entry.name.toLowerCase().includes(search) ||
        entry.assetId.toLowerCase().includes(search) ||
        entry.code.toLowerCase().includes(search);

      const matchesType = filters.type === "all" || entry.category === filters.type;
      const matchesStatus = filters.status === "all" || entry.status === filters.status;

      // Country isn't part of the mocked entry shape yet — kept as a pass-through
      // filter so the toolbar UI is fully wired once country data is available.
      const matchesCountry = filters.country === "all" || true;

      return matchesSearch && matchesType && matchesStatus && matchesCountry;
    });
  }, [entries, filters]);

  return { filters, setSearch, setType, setStatus, setCountry, filteredEntries };
}
