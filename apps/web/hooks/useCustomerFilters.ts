import { useCallback } from 'react';

export function useCustomerFilters(
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

  const applyBasicFilters = useCallback((selectedCustomerType: string, selectedCategory: string) => {
    const newFilters: Record<string, any> = {};
    
    if (selectedCustomerType !== "all") {
      newFilters.customerType = selectedCustomerType;
    }
    
    if (selectedCategory !== "all") {
      if (selectedCategory === 'vip') {
        newFilters.purchaseRange = '5+';
      } else if (selectedCategory === 'regular') {
        newFilters.purchaseRange = '1-2';
      } else if (selectedCategory === 'novo') {
        newFilters.purchaseRange = '0';
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