"use client";

import { useCallback } from "react";

interface LegacyClientFilters {
  status?: "active" | "inactive" | "all";
  debtRange?: "low" | "medium" | "high" | "all";
  search?: string;
}

interface UseLegacyClientFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  filters: LegacyClientFilters;
  updateFilters: (filters: LegacyClientFilters) => void;
  getActiveFiltersCount: number;
}

export function useLegacyClientFilters({
  search,
  setSearch,
  filters,
  updateFilters,
  getActiveFiltersCount,
}: UseLegacyClientFiltersProps) {
  const handleUpdateFilters = useCallback((newFilters: Record<string, any>) => {
    updateFilters({ ...filters, ...newFilters });
  }, [filters, updateFilters]);

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