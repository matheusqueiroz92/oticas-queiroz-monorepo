"use client";

import { useCallback } from "react";
import type { ReportType, ReportStatus } from "@/app/_types/report";

interface ReportFilters {
  search?: string;
  type?: ReportType;
  status?: ReportStatus;
  startDate?: Date;
  endDate?: Date;
}

interface UseReportFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  filters: ReportFilters;
  updateFilters: (filters: ReportFilters) => void;
  getActiveFiltersCount: () => number;
}

export function useReportFilters({
  // search,
  setSearch,
  filters,
  updateFilters,
  getActiveFiltersCount,
}: UseReportFiltersProps) {
  const handleUpdateFilters = useCallback(
    (newFilters: Record<string, any>) => {
      updateFilters({ ...filters, ...newFilters });
    },
    [filters, updateFilters]
  );

  const handleClearAllFilters = useCallback(() => {
    setSearch("");
    updateFilters({});
  }, [setSearch, updateFilters]);

  const applyBasicFilters = useCallback(() => {
    if (getActiveFiltersCount === 0) {
      updateFilters({});
    }
  }, [getActiveFiltersCount, updateFilters]);

  return {
    handleUpdateFilters,
    handleClearAllFilters,
    applyBasicFilters,
  };
} 