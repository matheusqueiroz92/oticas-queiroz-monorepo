import { useCallback } from 'react';

export function useLaboratoryFilters(
  search: string,
  setSearch: (value: string) => void,
  filters: Record<string, any>,
  updateFilters: (filters: Record<string, any>) => void,
  getActiveFiltersCount: number
) {
  const handleUpdateFilters = useCallback((newFilters: Record<string, any>) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleClearAllFilters = useCallback(() => {
    setSearch("");
    updateFilters({ sort: "name" });
  }, [setSearch, updateFilters]);

  const applyBasicFilters = useCallback((selectedStatus: string, selectedCity: string) => {
    const newFilters: Record<string, any> = {};
    
    if (selectedStatus !== "todos") {
      newFilters.isActive = selectedStatus === 'ativo';
    }
    
    if (selectedCity !== "todos") {
      newFilters.city = selectedCity;
    }
    
    updateFilters(newFilters);
  }, [updateFilters]);

  return {
    handleUpdateFilters,
    handleClearAllFilters,
    applyBasicFilters,
  };
} 