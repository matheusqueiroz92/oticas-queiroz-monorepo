import { useCallback } from 'react';

interface OrdersFiltersProps {
  search: string;
  filters: Record<string, any>;
  setSearch: (search: string) => void;
  updateFilters: (filters: Record<string, any>) => void;
}

export function useOrdersFilters({ search, filters, setSearch, updateFilters }: OrdersFiltersProps) {
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (search) count++;
    return count;
  }, [search]);

  const handleStatusFilterChange = useCallback((value: string) => {
    updateFilters({ 
      ...filters, 
      status: value === "todos" ? undefined : value 
    });
  }, [filters, updateFilters]);

  const handleUpdateFilters = useCallback((newFilters: Record<string, any>) => {
    const merged = { ...filters, ...newFilters };
    if (!('paymentMethod' in newFilters)) delete (merged as any).paymentMethod;
    if (!('paymentStatus' in newFilters)) delete (merged as any).paymentStatus;
    if (!('employeeId' in newFilters)) delete (merged as any).employeeId;
    if (!('laboratoryId' in newFilters)) delete (merged as any).laboratoryId;
    if (!('startDate' in newFilters)) delete (merged as any).startDate;
    if (!('endDate' in newFilters)) delete (merged as any).endDate;
    updateFilters(merged);
  }, [filters, updateFilters]);

  return {
    getActiveFiltersCount,
    handleStatusFilterChange,
    handleUpdateFilters,
  };
} 