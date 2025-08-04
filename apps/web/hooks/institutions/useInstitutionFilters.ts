"use client";

import { useCallback } from "react";

export function useInstitutionFilters(
  search: string,
  setSearch: (search: string) => void,
  filters: Record<string, any>,
  updateFilters: (filters: Record<string, any>) => void,
  getActiveFiltersCount: () => number
) {
  const handleUpdateFilters = useCallback((newFilters: Record<string, any>) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleClearAllFilters = useCallback(() => {
    setSearch("");
    updateFilters({
      status: "",
      industryType: "",
      contactPerson: "",
      hasImage: "",
    });
  }, [setSearch, updateFilters]);

  const applyBasicFilters = useCallback((selectedStatus: string, selectedIndustryType: string) => {
    const newFilters = { ...filters };
    
    // Aplicar filtro de status
    if (selectedStatus && selectedStatus !== "todos") {
      newFilters.status = selectedStatus;
    } else {
      delete newFilters.status;
    }
    
    // Aplicar filtro de tipo de indústria
    if (selectedIndustryType && selectedIndustryType !== "todos") {
      newFilters.industryType = selectedIndustryType;
    } else {
      delete newFilters.industryType;
    }
    
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  return {
    handleUpdateFilters,
    handleClearAllFilters,
    applyBasicFilters,
  };
}