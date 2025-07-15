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

  const applyBasicFilters = useCallback((selectedRole: string, selectedStatus: string) => {
    const newFilters: Record<string, any> = {};
    
    if (selectedRole !== "todos") {
      newFilters.role = selectedRole;
    }
    
    if (selectedStatus !== "todos") {
      if (selectedStatus === 'ativo') {
        newFilters.salesRange = '1+';
      } else if (selectedStatus === 'inativo') {
        newFilters.salesRange = '0';
      }
    }
    
    updateFilters(newFilters);
  }, [updateFilters]);

  return {
    handleUpdateFilters,
    handleClearAllFilters,
    applyBasicFilters,
  };
} 