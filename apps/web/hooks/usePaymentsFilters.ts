import { useCallback } from 'react';
import type { PaymentType, PaymentStatus, PaymentMethod } from '@/app/_types/payment';

interface UsePaymentsFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  filters: Record<string, any>;
  updateFilters: (filters: Record<string, any>) => void;
}

export function usePaymentsFilters({
  search,
  setSearch,
  filters,
  updateFilters,
}: UsePaymentsFiltersProps) {
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (search) count++;
    if (filters.type && filters.type !== 'all') count++;
    if (filters.paymentMethod && filters.paymentMethod !== 'all') count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [search, filters]);

  const handleTypeFilterChange = useCallback((value: string) => {
    updateFilters({ 
      ...filters, 
      type: value === "all" ? undefined : value as PaymentType 
    });
  }, [filters, updateFilters]);

  const handlePaymentMethodFilterChange = useCallback((value: string) => {
    updateFilters({ 
      ...filters, 
      paymentMethod: value === "all" ? undefined : value as PaymentMethod 
    });
  }, [filters, updateFilters]);

  const handleStatusFilterChange = useCallback((value: string) => {
    updateFilters({ 
      ...filters, 
      status: value === "all" ? undefined : value as PaymentStatus 
    });
  }, [filters, updateFilters]);

  const handleUpdateFilters = useCallback((newFilters: Record<string, any>) => {
    const merged = { ...filters, ...newFilters };
    // Remover filtros vazios
    Object.keys(merged).forEach(key => {
      if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
        delete merged[key];
      }
    });
    updateFilters(merged);
  }, [filters, updateFilters]);

  const handleClearAllFilters = useCallback(() => {
    setSearch("");
    updateFilters({});
  }, [setSearch, updateFilters]);

  return {
    getActiveFiltersCount,
    handleTypeFilterChange,
    handlePaymentMethodFilterChange,
    handleStatusFilterChange,
    handleUpdateFilters,
    handleClearAllFilters,
  };
} 