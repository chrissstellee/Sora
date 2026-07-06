"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, X } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export type SortDirection = "asc" | "desc";

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

export interface DataTableColumn<TData> {
  /** Unique key for the column, also used as the sorting identifier */
  key: string;
  /** Header label */
  header: React.ReactNode;
  /** Renders the cell content for a given row */
  cell: (row: TData) => React.ReactNode;
  /** Enables the sort toggle in the header. Requires `sortValue` to actually reorder rows. */
  sortable?: boolean;
  /** Returns the raw comparable value used when sorting by this column */
  sortValue?: (row: TData) => string | number | Date | null | undefined;
  headerClassName?: string;
  cellClassName?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  /** Returns a unique identifier for a row — used for React keys and selection */
  rowKey: (row: TData) => string | number;

  /** Adds a checkbox column with select-all support. Off by default. */
  selectable?: boolean;
  /** Controlled selection. Omit to let the table manage its own selection state. */
  selectedRowKeys?: Array<string | number>;
  onSelectedRowKeysChange?: (keys: Array<string | number>) => void;

  /** Makes rows clickable. Omit to leave rows non-interactive. */
  onRowClick?: (row: TData) => void;

  /** Pagination */
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  /** Controlled current page (1-indexed). Omit to let the table manage it internally. */
  page?: number;
  onPageChange?: (page: number) => void;

  /** Label used in the "Showing X-Y of Z {itemLabel}" summary */
  itemLabel?: string;
  emptyMessage?: string;
  isLoading?: boolean;

  defaultSort?: DataTableSort;
  className?: string;
  containerClassName?: string;
  /**
   * Caps the height of the scrollable row area (e.g. "480px", "60vh") while the
   * header and footer stay fixed in place. Omit to let the table grow naturally.
   */
  maxHeight?: string;
}

export function DataTable<TData>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedRowKeys,
  onSelectedRowKeysChange,
  onRowClick,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize,
  page: pageProp,
  onPageChange,
  itemLabel = "results",
  emptyMessage = "No results.",
  isLoading = false,
  defaultSort,
  className,
  containerClassName,
  maxHeight,
}: DataTableProps<TData>) {
  const [sort, setSort] = React.useState<DataTableSort | null>(defaultSort ?? null);
  const [internalPage, setInternalPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize ?? pageSizeOptions[0] ?? 10);
  const [internalSelected, setInternalSelected] = React.useState<Array<string | number>>([]);

  const page = pageProp ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;
  const selectedKeys = selectedRowKeys ?? internalSelected;
  const setSelectedKeys = onSelectedRowKeysChange ?? setInternalSelected;

  // Jump back to page 1 whenever the underlying data set or page size changes.
  React.useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, pageSize]);

  const sortedData = React.useMemo(() => {
    if (!sort) return data;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return data;

    const withValues = data.map((row, index) => ({
      row,
      index,
      value: column.sortValue!(row),
    }));

    withValues.sort((a, b) => {
      if (a.value == null && b.value == null) return a.index - b.index;
      if (a.value == null) return 1;
      if (b.value == null) return -1;

      if (a.value instanceof Date || b.value instanceof Date) {
        const at = a.value instanceof Date ? a.value.getTime() : new Date(a.value).getTime();
        const bt = b.value instanceof Date ? b.value.getTime() : new Date(b.value).getTime();
        return at - bt;
      }

      if (typeof a.value === "number" && typeof b.value === "number") {
        return a.value - b.value;
      }

      return String(a.value).localeCompare(String(b.value), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    const ordered = withValues.map((v) => v.row);
    return sort.direction === "desc" ? ordered.reverse() : ordered;
  }, [data, sort, columns]);

  const totalCount = sortedData.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, pageCount);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);
  const colSpan = columns.length + (selectable ? 1 : 0);

  const handleSort = (columnKey: string) => {
    setSort((current) => {
      if (!current || current.key !== columnKey) return { key: columnKey, direction: "asc" };
      if (current.direction === "asc") return { key: columnKey, direction: "desc" };
      return null;
    });
  };

  const resetSort = () => setSort(null);

  const pageKeys = React.useMemo(() => paginatedData.map(rowKey), [paginatedData, rowKey]);
  const allSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedKeys.includes(k));
  const someSelected = !allSelected && pageKeys.some((k) => selectedKeys.includes(k));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(selectedKeys.filter((k) => !pageKeys.includes(k)));
    } else {
      setSelectedKeys(Array.from(new Set([...selectedKeys, ...pageKeys])));
    }
  };

  const toggleRow = (key: string | number) => {
    setSelectedKeys(
      selectedKeys.includes(key) ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key],
    );
  };

  const getVisiblePages = (current: number, total: number) => {
    const pages = Array.from({ length: total }, (_, i) => i + 1);
    return pages.filter(
      (p) =>
        p === 1 ||
        p === total ||
        (current <= 2 && p <= 3) ||
        (current >= total - 1 && p >= total - 2) ||
        (p >= current - 1 && p <= current + 1),
    );
  };

  const visiblePages = getVisiblePages(currentPage, pageCount);

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card",
        containerClassName,
      )}
    >
      <div className={cn("overflow-auto", className)} style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full caption-bottom text-sm" data-slot="table">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted hover:bg-muted">
              {selectable && (
                <TableHead className="sticky top-0 z-10 w-10 bg-muted pl-4">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows on this page"
                  />
                </TableHead>
              )}

              {columns.map((column) => {
                const isSorted = sort?.key === column.key;
                return (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "sticky top-0 z-10 h-11 bg-muted text-xs font-medium tracking-wider text-muted-foreground uppercase",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      column.headerClassName,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 tracking-wider uppercase transition-colors hover:text-foreground",
                          isSorted && "text-foreground",
                        )}
                      >
                        <span>{column.header}</span>
                        {isSorted ? (
                          sort?.direction === "asc" ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : paginatedData.length ? (
              paginatedData.map((row) => {
                const key = rowKey(row);
                const isSelected = selectedKeys.includes(key);

                return (
                  <TableRow
                    key={key}
                    data-state={isSelected ? "selected" : undefined}
                    onClick={() => onRowClick?.(row)}
                    className={cn("border-border", onRowClick && "cursor-pointer")}
                  >
                    {selectable && (
                      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(key)}
                          aria-label="Select row"
                        />
                      </TableCell>
                    )}

                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.align === "right" && "text-right",
                          column.align === "center" && "text-center",
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      <div className="flex w-full flex-col-reverse items-stretch gap-3 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-start sm:gap-3">
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger size="sm" className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  Show {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-center text-sm text-muted-foreground sm:text-left">
            {totalCount === 0
              ? `No ${itemLabel}`
              : `Showing ${startIndex}-${endIndex} of ${totalCount.toLocaleString()} ${itemLabel}`}
          </p>

          {sort && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSort}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              <span className="hidden sm:inline">Reset sort</span>
            </Button>
          )}
        </div>

        <div className="flex w-full items-center justify-center gap-1 overflow-x-auto sm:w-auto sm:justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="shrink-0"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {visiblePages.map((p, index) => {
            const prev = index > 0 ? visiblePages[index - 1] : undefined;
            const showEllipsisBefore = prev !== undefined && p - prev > 1;
            const isActive = p === currentPage;

            return (
              <React.Fragment key={p}>
                {showEllipsisBefore && (
                  <span className="px-1 text-sm text-muted-foreground">…</span>
                )}
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setPage(p)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "shrink-0 text-sm",
                    !isActive && "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p}
                </Button>
              </React.Fragment>
            );
          })}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
            className="shrink-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
