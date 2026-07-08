"use client";

import * as React from "react";

import type { IDocumentEntry } from "../lib/types";

export interface DocumentFiltersState {
  search: string;
  type: string;
  status: string;
  country: string;
}

const DEFAULT_FILTERS: DocumentFiltersState = {
  search: "",
  type: "all",
  status: "all",
  country: "all",
};

interface IUseDocumentFiltersResult {
  filters: DocumentFiltersState;
  setSearch: (value: string) => void;
  setType: (value: string) => void;
  setStatus: (value: string) => void;
  setCountry: (value: string) => void;
  filteredDocuments: IDocumentEntry[];
}

export function useDocumentFilters(documents: IDocumentEntry[]): IUseDocumentFiltersResult {
  const [filters, setFilters] = React.useState<DocumentFiltersState>(DEFAULT_FILTERS);

  const setSearch = (value: string) => setFilters((prev) => ({ ...prev, search: value }));
  const setType = (value: string) => setFilters((prev) => ({ ...prev, type: value }));
  const setStatus = (value: string) => setFilters((prev) => ({ ...prev, status: value }));
  const setCountry = (value: string) => setFilters((prev) => ({ ...prev, country: value }));

  const filteredDocuments = React.useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return documents.filter((doc) => {
      const matchesSearch =
        !search ||
        doc.name.toLowerCase().includes(search) ||
        doc.linkedAssetId.toLowerCase().includes(search) ||
        doc.uploadedBy.toLowerCase().includes(search);

      const matchesType = filters.type === "all" || doc.type === filters.type;
      const matchesStatus = filters.status === "all" || doc.status === filters.status;

      // Country isn't part of the mocked entry shape yet — kept as a pass-through
      // filter so the toolbar UI is fully wired once country data is available.
      const matchesCountry = filters.country === "all" || true;

      return matchesSearch && matchesType && matchesStatus && matchesCountry;
    });
  }, [documents, filters]);

  return { filters, setSearch, setType, setStatus, setCountry, filteredDocuments };
}
