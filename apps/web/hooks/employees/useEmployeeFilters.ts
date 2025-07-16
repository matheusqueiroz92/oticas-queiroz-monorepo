import { useCallback } from 'react';

export function useEmployeeFilters(
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

  return {
    handleUpdateFilters,
    handleClearAllFilters,
  };
} 